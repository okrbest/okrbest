// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

export type FieldType = (
    'text' |
    'select' |
    'multiselect' |
    'date' |
    'user' |
    'multiuser'
);

export type PropertyField = {
    id: string;
    group_id: string;
    name: string;
    type: FieldType;
    attrs?: {
        subType?: string;
        [key: string]: unknown;
    };
    target_id?: string;
    target_type?: string;
    create_at: number;
    update_at: number;
    delete_at: number;
};

export type NameMappedPropertyFields = {[key: PropertyField['name']]: PropertyField};

export type PropertyValue<T> = {
    id: string;
    target_id: string;
    target_type: string;
    group_id: string;
    field_id: string;
    value: T;
    create_at: number;
    update_at: number;
    delete_at: number;
}

export type UserPropertyFieldType = 'text' | 'select' | 'multiselect';

/**
 * Known property-field group identifiers for user-targeted attributes.
 *
 * - `custom_profile_attributes`: long-lived user attributes managed through
 *   the Custom Profile Attributes feature (CPA group).
 * - `session_attributes`: per-session, environmental attributes the live
 *   PDP injects into evaluation (e.g. `network_status`, `client_type`,
 *   `device_managed`). Defined as a group so ABAC tooling — like the
 *   "Test access rule" simulator — can detect whether session-attribute
 *   plumbing is configured and progressively expose features (the
 *   "Use active session" checkbox + "Configure session attributes" panel)
 *   only when at least one session attribute exists.
 */
export type UserPropertyFieldGroupID = 'custom_profile_attributes' | 'session_attributes';

export const SESSION_ATTRIBUTES_GROUP_ID: UserPropertyFieldGroupID = 'session_attributes';

export type UserPropertyValueType = 'phone' | 'url' | '';

export type FieldVisibility = 'always' | 'hidden' | 'when_set';
export type FieldValueType =
    'email' |
    'url' |
    'phone' |
    '';

export type PropertyFieldOption = {
    id: string;
    name: string;
    color?: string;
}

export type UserPropertyField = PropertyField & {
    group_id: UserPropertyFieldGroupID;
    attrs: {
        sort_order: number;
        visibility: FieldVisibility;
        value_type: FieldValueType;
        options?: PropertyFieldOption[];
        ldap?: string;
        saml?: string;
        managed?: string;
        protected?: boolean;
        source_plugin_id?: string;
        access_mode?: '' | 'source_only' | 'shared_only';
        display_name?: string;
    };
};

export type SelectPropertyField = PropertyField & {
    attrs?: {
        editable?: boolean;
        options?: PropertyFieldOption[];
    };
}

export const supportsOptions = (field: UserPropertyField) => {
    return field.type === 'select' || field.type === 'multiselect';
};

export type UserPropertyFieldPatch = Partial<Pick<UserPropertyField, 'name' | 'attrs' | 'type'>>;
