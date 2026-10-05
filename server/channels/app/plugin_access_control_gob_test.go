// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

package app

import (
	"bytes"
	"encoding/gob"
	"encoding/json"
	"testing"

	"github.com/mattermost/mattermost/server/public/model"
	"github.com/stretchr/testify/require"
)

// requirePluginRPCGobSafe gob-encodes v the way the plugin RPC layer encodes
// an API reply (public/plugin's client_rpc gob registrations are active via
// the import). An unregistered concrete type inside an interface-typed field
// fails encoding, which shuts down the shared plugin RPC connection.
func requirePluginRPCGobSafe(t *testing.T, v any) {
	t.Helper()
	var buf bytes.Buffer
	require.NoError(t, gob.NewEncoder(&buf).Encode(v),
		"reply payload must gob-encode with client_rpc registrations; an unregistered concrete type inside `any` poisons the plugin RPC connection")
}

// TestPluginAccessControlGobSafety pins that every payload the plugin access
// control API can return over net/rpc survives gob encoding.
//
// okrbest: upstream's "fields autocomplete response including native attribute
// fields" subtest is dropped. It regression-tests native attribute select
// options (model/native_attributes.go), which come from the excluded ABAC
// native attributes Phase 5 (84a554b2) and do not exist here.
func TestPluginAccessControlGobSafety(t *testing.T) {
	th := Setup(t).InitBasic(t)

	t.Run("policy with JSON-decoded Props", func(t *testing.T) {
		// Stored policies hydrate Props via json.Unmarshal, so the concrete
		// types inside are exactly the ones gob accepts; pin that.
		var props map[string]any
		require.NoError(t, json.Unmarshal(
			[]byte(`{"nested":{"k":"v"},"list":[1,"two",true],"s":"x","n":1.5,"b":true,"z":null}`), &props))

		p := validPluginPolicy(model.NewId())
		p.Props = props
		requirePluginRPCGobSafe(t, p)
	})

	t.Run("visual AST with every runtime value shape", func(t *testing.T) {
		// The enterprise AST→visual conversion produces these value shapes.
		visual := &model.VisualExpression{Conditions: []model.Condition{
			{Attribute: "user.attributes.team", Operator: "==", Value: "eng"},
			{Attribute: "user.attributes.admin", Operator: "==", Value: true},
			{Attribute: "user.attributes.age", Operator: ">", Value: int64(30)},
			{Attribute: "user.attributes.count", Operator: "<", Value: uint64(10)},
			{Attribute: "user.attributes.score", Operator: ">=", Value: 1.5},
			{Attribute: "user.attributes.missing", Operator: "==", Value: nil},
			{Attribute: "user.attributes.role", Operator: "in", Value: []any{"a", "b"}},
		}}
		requirePluginRPCGobSafe(t, visual)
	})

	t.Run("expression check errors", func(t *testing.T) {
		requirePluginRPCGobSafe(t, []model.CELExpressionError{{Line: 1, Column: 2, Message: "boom"}})
	})

	t.Run("query users response with a real user", func(t *testing.T) {
		requirePluginRPCGobSafe(t, &model.AccessControlPolicyTestResponse{Users: []*model.User{th.BasicUser}, Total: 1})
	})

	t.Run("evaluation decision carrying a context reason", func(t *testing.T) {
		decision := model.NewNoPolicyAccessDecision()
		requirePluginRPCGobSafe(t, &decision)
	})
}
