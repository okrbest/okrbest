// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

package app

import (
	"net/http"

	"github.com/mattermost/mattermost/server/public/model"
	"github.com/mattermost/mattermost/server/public/shared/request"
)

// invalidateUserPropertyValuesEpochs marks the AttributeView stale and drops the cached CPA epoch
// for every distinct user the values target. It keys off each value's own TargetType/TargetID
// rather than a caller-supplied object type, to stay correct for plugin callers that pass none.
//
// Both halves must move together: the epoch alone forces a refetch that renders from a stale view
// and then caches that under the new ETag, and the view alone leaves the client 304ing on content
// sanitized under the old attributes.
func (a *App) invalidateUserPropertyValuesEpochs(values []*model.PropertyValue) {
	seen := make(map[string]bool, len(values))
	for _, v := range values {
		if v == nil || v.TargetType != model.PropertyValueTargetTypeUser || seen[v.TargetID] {
			continue
		}
		seen[v.TargetID] = true
	}
	if len(seen) == 0 {
		return
	}

	a.invalidateAttributeViewCache()

	// Only the epoch half is gated: nothing reads it while ABAC is off, and each invalidation
	// costs a cluster message. A flip clears both caches wholesale, so nothing skipped here
	// survives as a stale entry.
	if !a.attributeBasedAccessControlEnabled() {
		return
	}
	for targetID := range seen {
		a.Srv().Store().Attributes().InvalidateUserPropertyValuesEpoch(targetID)
		a.Srv().Store().Attributes().InvalidateUserAttributes(targetID)
	}
}

// invalidateUserPropertyValuesEpoch is the single-target form, for delete paths that have a target
// ID rather than a set of values. Same split gate as above.
func (a *App) invalidateUserPropertyValuesEpoch(targetType, targetID string) {
	if targetType != model.PropertyValueTargetTypeUser {
		return
	}

	a.invalidateAttributeViewCache()

	if !a.attributeBasedAccessControlEnabled() {
		return
	}
	a.Srv().Store().Attributes().InvalidateUserPropertyValuesEpoch(targetID)
	a.Srv().Store().Attributes().InvalidateUserAttributes(targetID)
}

// invalidateAllUserAttributeCaches marks the AttributeView stale and drops every cached CPA epoch.
// For field mutations, which change what every subject resolves to without touching a single
// PropertyValues row, and so are invisible to an epoch computed from that table.
func (a *App) invalidateAllUserAttributeCaches() {
	a.invalidateAttributeViewCache()

	if !a.attributeBasedAccessControlEnabled() {
		return
	}
	a.Srv().Store().Attributes().ClearUserPropertyValuesEpochCache()
	a.Srv().Store().Attributes().ClearUserAttributesCache()
}

// CreatePropertyValue creates a new property value.
func (a *App) CreatePropertyValue(rctx request.CTX, value *model.PropertyValue) (*model.PropertyValue, *model.AppError) {
	if value == nil {
		return nil, model.NewAppError("CreatePropertyValue", "app.property.invalid_input.app_error", nil, "property value is required", http.StatusBadRequest)
	}

	createdValue, err := a.Srv().propertyService.CreatePropertyValue(rctx, value)
	if err != nil {
		return nil, model.NewAppError("CreatePropertyValue", "app.property.create_value.app_error", nil, "", http.StatusInternalServerError).Wrap(err)
	}

	a.invalidateUserPropertyValuesEpochs([]*model.PropertyValue{createdValue})
	return createdValue, nil
}

// CreatePropertyValues creates multiple property values.
func (a *App) CreatePropertyValues(rctx request.CTX, values []*model.PropertyValue) ([]*model.PropertyValue, *model.AppError) {
	if len(values) == 0 {
		return nil, model.NewAppError("CreatePropertyValues", "app.property.invalid_input.app_error", nil, "property values are required", http.StatusBadRequest)
	}

	createdValues, err := a.Srv().propertyService.CreatePropertyValues(rctx, values)
	if err != nil {
		return nil, model.NewAppError("CreatePropertyValues", "app.property.create_values.app_error", nil, "", http.StatusInternalServerError).Wrap(err)
	}

	a.invalidateUserPropertyValuesEpochs(createdValues)
	return createdValues, nil
}

// GetPropertyValue retrieves a property value by group ID and value ID.
func (a *App) GetPropertyValue(rctx request.CTX, groupID, valueID string) (*model.PropertyValue, *model.AppError) {
	value, err := a.Srv().propertyService.GetPropertyValue(rctx, groupID, valueID)
	if err != nil {
		return nil, model.NewAppError("GetPropertyValue", "app.property.get_value.app_error", nil, "", http.StatusInternalServerError).Wrap(err)
	}
	return value, nil
}

// GetPropertyValues retrieves multiple property values by their IDs.
func (a *App) GetPropertyValues(rctx request.CTX, groupID string, ids []string) ([]*model.PropertyValue, *model.AppError) {
	values, err := a.Srv().propertyService.GetPropertyValues(rctx, groupID, ids)
	if err != nil {
		return nil, model.NewAppError("GetPropertyValues", "app.property.get_values.app_error", nil, "", http.StatusInternalServerError).Wrap(err)
	}
	return values, nil
}

// SearchPropertyValues searches for property values matching the given options.
func (a *App) SearchPropertyValues(rctx request.CTX, groupID string, opts model.PropertyValueSearchOpts) ([]*model.PropertyValue, *model.AppError) {
	values, err := a.Srv().propertyService.SearchPropertyValues(rctx, groupID, opts)
	if err != nil {
		return nil, model.NewAppError("SearchPropertyValues", "app.property.search_values.app_error", nil, "", http.StatusInternalServerError).Wrap(err)
	}
	return values, nil
}

// UpdatePropertyValue updates an existing property value.
func (a *App) UpdatePropertyValue(rctx request.CTX, groupID string, value *model.PropertyValue) (*model.PropertyValue, *model.AppError) {
	if value == nil {
		return nil, model.NewAppError("UpdatePropertyValue", "app.property.invalid_input.app_error", nil, "property value is required", http.StatusBadRequest)
	}

	updatedValue, err := a.Srv().propertyService.UpdatePropertyValue(rctx, groupID, value)
	if err != nil {
		return nil, model.NewAppError("UpdatePropertyValue", "app.property.update_value.app_error", nil, "", http.StatusInternalServerError).Wrap(err)
	}

	a.invalidateUserPropertyValuesEpochs([]*model.PropertyValue{updatedValue})
	return updatedValue, nil
}

// UpdatePropertyValues updates multiple property values.
func (a *App) UpdatePropertyValues(rctx request.CTX, groupID string, values []*model.PropertyValue) ([]*model.PropertyValue, *model.AppError) {
	if len(values) == 0 {
		return nil, model.NewAppError("UpdatePropertyValues", "app.property.invalid_input.app_error", nil, "property values are required", http.StatusBadRequest)
	}

	updatedValues, err := a.Srv().propertyService.UpdatePropertyValues(rctx, groupID, values)
	if err != nil {
		return nil, model.NewAppError("UpdatePropertyValues", "app.property.update_values.app_error", nil, "", http.StatusInternalServerError).Wrap(err)
	}

	a.invalidateUserPropertyValuesEpochs(updatedValues)
	return updatedValues, nil
}

// UpsertPropertyValue creates or updates a property value.
func (a *App) UpsertPropertyValue(rctx request.CTX, value *model.PropertyValue) (*model.PropertyValue, *model.AppError) {
	if value == nil {
		return nil, model.NewAppError("UpsertPropertyValue", "app.property.invalid_input.app_error", nil, "property value is required", http.StatusBadRequest)
	}

	upsertedValue, err := a.Srv().propertyService.UpsertPropertyValue(rctx, value)
	if err != nil {
		return nil, model.NewAppError("UpsertPropertyValue", "app.property.upsert_value.app_error", nil, "", http.StatusInternalServerError).Wrap(err)
	}

	a.invalidateUserPropertyValuesEpochs([]*model.PropertyValue{upsertedValue})
	return upsertedValue, nil
}

// UpsertPropertyValues creates or updates multiple property values.
func (a *App) UpsertPropertyValues(rctx request.CTX, values []*model.PropertyValue) ([]*model.PropertyValue, *model.AppError) {
	if len(values) == 0 {
		return nil, model.NewAppError("UpsertPropertyValues", "app.property.invalid_input.app_error", nil, "property values are required", http.StatusBadRequest)
	}

	upsertedValues, err := a.Srv().propertyService.UpsertPropertyValues(rctx, values)
	if err != nil {
		return nil, model.NewAppError("UpsertPropertyValues", "app.property.upsert_values.app_error", nil, "", http.StatusInternalServerError).Wrap(err)
	}

	a.invalidateUserPropertyValuesEpochs(upsertedValues)
	return upsertedValues, nil
}

// DeletePropertyValue deletes a property value.
func (a *App) DeletePropertyValue(rctx request.CTX, groupID, valueID string) *model.AppError {
	if err := a.Srv().propertyService.DeletePropertyValue(rctx, groupID, valueID); err != nil {
		return model.NewAppError("DeletePropertyValue", "app.property.delete_value.app_error", nil, "", http.StatusInternalServerError).Wrap(err)
	}

	// Only the value ID is in hand here, and fetching the row first just to learn its target would
	// add a query to every delete; clear the whole cache instead, as for a field delete.
	a.invalidateAllUserAttributeCaches()
	return nil
}

// DeletePropertyValuesForTarget deletes all property values for a target.
func (a *App) DeletePropertyValuesForTarget(rctx request.CTX, groupID, targetType, targetID string) *model.AppError {
	if err := a.Srv().propertyService.DeletePropertyValuesForTarget(rctx, groupID, targetType, targetID); err != nil {
		return model.NewAppError("DeletePropertyValuesForTarget", "app.property.delete_values_for_target.app_error", nil, "", http.StatusInternalServerError).Wrap(err)
	}

	a.invalidateUserPropertyValuesEpoch(targetType, targetID)
	return nil
}

// DeletePropertyValuesForField deletes all property values for a field.
func (a *App) DeletePropertyValuesForField(rctx request.CTX, groupID, fieldID string) *model.AppError {
	if err := a.Srv().propertyService.DeletePropertyValuesForField(rctx, groupID, fieldID); err != nil {
		return model.NewAppError("DeletePropertyValuesForField", "app.property.delete_values_for_field.app_error", nil, "", http.StatusInternalServerError).Wrap(err)
	}

	// A field delete can drop values for many users at once, so clear the whole epoch cache
	// rather than trying to enumerate the affected users.
	a.invalidateAllUserAttributeCaches()
	return nil
}
