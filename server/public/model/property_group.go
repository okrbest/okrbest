// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

package model

// AccessControlGroupFieldLimit caps how many property fields the access control
// group is expected to hold. okrbest: upstream defines this alongside
// AccessControlPropertyGroupName in the property v2 lineage (9f1fe90b), which we
// have not merged; the constant itself carries no v2 semantics.
const AccessControlGroupFieldLimit = 200

type PropertyGroup struct {
	ID   string
	Name string
}

func (pg *PropertyGroup) PreSave() {
	if pg.ID == "" {
		pg.ID = NewId()
	}
}
