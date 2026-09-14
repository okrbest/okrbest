// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {createStore} from 'redux';

import reducerRegistry from 'mattermost-redux/store/reducer_registry';

import {showRHSPlugin, hideRHSPlugin, toggleRHSPlugin} from 'actions/views/rhs';
import {registerPluginTranslationsSource} from 'actions/views/root';
import {registerPluginWebSocketEvent, unregisterPluginWebSocketEvent, registerPluginReconnectHandler, unregisterPluginReconnectHandler} from 'actions/websocket_actions';
import pluginsReducer from 'reducers/plugins';

import {ActionTypes, RHSStates} from 'utils/constants';
import {registerRHSPluginPopoutListener} from 'utils/popouts/popout_windows';

import type {GlobalState} from 'types/store';

import PluginRegistry from './registry';

// Replace the module-singleton store so registry.ts dispatches into our real reducer store.
// Jest hoists mock factories before module imports, so `mockGetStore` is used as an indirection:
// the factory closes over it, and tests reassign the underlying store instance per-test.
let mockCurrentStore: ReturnType<typeof createStore<ReturnType<typeof pluginsReducer>, any, any, any>>;

jest.mock('stores/redux_store', () => ({
    dispatch: (...args: any[]) => mockCurrentStore.dispatch(...args),
    getState: () => mockCurrentStore.getState(),
    subscribe: (...args: any[]) => mockCurrentStore.subscribe(...args),
}));

// Stub out side-effecting imports that registry.ts pulls in but aren't needed for this test.
jest.mock('mattermost-redux/store/reducer_registry', () => ({default: {register: jest.fn()}, register: jest.fn()}));
jest.mock('actions/admin_actions', () => ({
    registerAdminConsolePlugin: jest.fn(),
    unregisterAdminConsolePlugin: jest.fn(),
    registerAdminConsoleCustomSetting: jest.fn(),
    registerAdminConsoleCustomSection: jest.fn(),
}));
jest.mock('actions/views/rhs', () => ({
    showRHSPlugin: jest.fn(),
    hideRHSPlugin: jest.fn(),
    toggleRHSPlugin: jest.fn(),
}));
jest.mock('actions/views/root', () => ({
    registerPluginTranslationsSource: jest.fn(),
}));
jest.mock('actions/websocket_actions', () => ({
    registerPluginWebSocketEvent: jest.fn(),
    unregisterPluginWebSocketEvent: jest.fn(),
    registerPluginReconnectHandler: jest.fn(),
    unregisterPluginReconnectHandler: jest.fn(),
}));
jest.mock('utils/popouts/popout_windows', () => ({
    registerRHSPluginPopoutListener: jest.fn(),
}));

describe('PluginRegistry lifetime', () => {
    beforeEach(() => {
        mockCurrentStore = createStore(pluginsReducer);
    });

    it('ignores saved registration functions without changing their return values', () => {
        let active = true;
        const registry = new PluginRegistry('test_plugin', () => active);
        const registerRoot = registry.registerRootComponent;
        const {rootRegisterMenuItem} = registry.registerPostDropdownSubMenuAction('Menu', jest.fn(), () => true);
        const before = mockCurrentStore.getState();

        active = false;

        expect(registerRoot(() => null)).toEqual(expect.any(String));
        expect(rootRegisterMenuItem('Child', jest.fn(), () => true)).toEqual(expect.any(Function));
        expect(registry.registerSearchComponents({
            buttonComponent: () => null,
            suggestionsComponent: () => null,
            hintsComponent: () => null,
            action: jest.fn(),
        })).toEqual(expect.any(String));
        registry.unregisterComponent('replacement-component');
        registry.unregisterPostTypeComponent('replacement-post');
        registry.unregisterAdminConsolePlugin();
        expect(mockCurrentStore.getState()).toBe(before);
    });

    it('ignores non-Redux registrations and unregisters after failure', () => {
        const registry = new PluginRegistry('test_plugin', () => false);
        registry.registerReducer((state = {}) => state);
        registry.registerWebSocketEventHandler('test', jest.fn());
        registry.unregisterWebSocketEventHandler('test');
        registry.registerReconnectHandler(jest.fn());
        registry.unregisterReconnectHandler();
        registry.registerTranslations(() => ({}));
        registry.registerRHSPluginPopoutListener('test_plugin', jest.fn());

        expect(reducerRegistry.register).not.toHaveBeenCalled();
        expect(registerPluginWebSocketEvent).not.toHaveBeenCalled();
        expect(unregisterPluginWebSocketEvent).not.toHaveBeenCalled();
        expect(registerPluginReconnectHandler).not.toHaveBeenCalled();
        expect(unregisterPluginReconnectHandler).not.toHaveBeenCalled();
        expect(registerPluginTranslationsSource).not.toHaveBeenCalled();
        expect(registerRHSPluginPopoutListener).not.toHaveBeenCalled();
    });

    it('keeps sidebar handles dispatchable but inert after failure', () => {
        const rhsActions = jest.requireActual('actions/views/rhs');
        jest.mocked(showRHSPlugin).mockImplementation(rhsActions.showRHSPlugin);
        jest.mocked(hideRHSPlugin).mockImplementation(rhsActions.hideRHSPlugin);
        jest.mocked(toggleRHSPlugin).mockImplementation(rhsActions.toggleRHSPlugin);
        let active = true;
        const registry = new PluginRegistry('test_plugin', () => active);
        const handle = registry.registerRightHandSidebarComponent(() => null, 'Sidebar');
        const dispatch = jest.fn();
        const getState = () => ({views: {rhs: {pluggableId: ''}}}) as GlobalState;

        handle.showRHSPlugin(dispatch, getState, undefined);
        expect(dispatch).toHaveBeenCalledWith({
            type: ActionTypes.UPDATE_RHS_STATE,
            state: RHSStates.PLUGIN,
            pluggableId: handle.id,
        });
        dispatch.mockClear();
        active = false;
        const before = mockCurrentStore.getState();
        const lateHandle = registry.registerRightHandSidebarComponent(() => null, 'Late sidebar');
        const appBar = registry.registerAppBarComponent({
            iconUrl: 'icon.png',
            tooltipText: 'Plugin',
            rhsComponent: () => null,
            rhsTitle: 'Late sidebar',
        });

        for (const sidebar of [handle, lateHandle, typeof appBar === 'string' ? undefined : appBar.rhsComponent]) {
            expect(sidebar?.id).toEqual(expect.any(String));
            expect(sidebar?.showRHSPlugin(dispatch, getState, undefined)).toEqual({data: false});
            expect(sidebar?.hideRHSPlugin(dispatch, getState, undefined)).toEqual({data: false});
            expect(sidebar?.toggleRHSPlugin(dispatch, getState, undefined)).toEqual({data: false});
        }
        expect(dispatch).not.toHaveBeenCalled();
        expect(mockCurrentStore.getState()).toBe(before);
    });
});
