// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import type {DeepPartial} from '@mattermost/types/utilities';

import type {GlobalState} from 'types/store';
import type {ChannelHeaderAction, MobileChannelHeaderButtonAction} from 'types/store/plugins';

import {
    getChannelHeaderMenuPluginComponents,
    getChannelMobileHeaderPluginButtons,
    getPluginUserSettings,
} from './plugins';

describe('Selectors.Plugins', () => {
    describe('getPluginUserSettings', () => {
        it('has no settings', () => {
            const state: DeepPartial<GlobalState> = {
                plugins: {},
            };

            expect(getPluginUserSettings(state as GlobalState)).toEqual({});
        });

        it('has settings', () => {
            const stateSettings = {
                pluginId: {
                    id: 'pluginId',
                },
                pluginId2: {
                    id: 'pluginId2',
                },
            };
            const state: DeepPartial<GlobalState> = {
                plugins: {
                    userSettings: stateSettings,
                },
            };

            expect(getPluginUserSettings(state as GlobalState)).toEqual(stateSettings);
        });
    });

    describe('getChannelHeaderMenuPluginComponents', () => {
        function makeState(channelHeaderComponents: ChannelHeaderAction[]): GlobalState {
            const state: DeepPartial<GlobalState> = {
                entities: {
                    general: {
                        config: {},
                    },
                    preferences: {
                        myPreferences: {},
                    },
                },
                plugins: {
                    components: {
                        ChannelHeader: channelHeaderComponents,
                    },
                },
            };

            return state as GlobalState;
        }

        test('no channel header components found', () => {
            const expectedComponents: ChannelHeaderAction[] = [];
            const state = makeState(expectedComponents);

            expect(getChannelHeaderMenuPluginComponents(state)).toEqual(expectedComponents);
        });

        test('one channel header component found as shouldRender returns true', () => {
            const expectedComponents = [
                {
                    shouldRender: () => true,
                },
            ] as unknown as ChannelHeaderAction[];
            const state = makeState(expectedComponents);

            expect(getChannelHeaderMenuPluginComponents(state)).toEqual(expectedComponents);
        });

        test('one channel header component found as shouldRender is not defined', () => {
            const expectedComponents = [
                {
                    id: 'testId',
                },
            ] as ChannelHeaderAction[];
            const state = makeState(expectedComponents);

            expect(getChannelHeaderMenuPluginComponents(state)).toEqual(expectedComponents);
        });

        test('no channel header components found as shouldRender returns false', () => {
            const state = makeState([
                {
                    shouldRender: () => false,
                },
            ] as unknown as ChannelHeaderAction[]);

            expect(getChannelHeaderMenuPluginComponents(state)).toEqual([]);
        });

        test('memoization', () => {
            let shouldRenderResult = false;

            let state = makeState([
                {
                    shouldRender: () => shouldRenderResult,
                },
            ] as unknown as ChannelHeaderAction[]);

            const firstResult = getChannelHeaderMenuPluginComponents(state);

            expect(firstResult).toEqual([]);

            // No changes to state
            const secondResult = getChannelHeaderMenuPluginComponents(state);

            expect(secondResult).toBe(firstResult);

            // Something unrelated changed in state
            state = {...state};

            const thirdResult = getChannelHeaderMenuPluginComponents(state);

            expect(thirdResult).toBe(firstResult);

            // shouldRender changed because something else in state changed
            state = {...state};
            shouldRenderResult = true;

            const fourthResult = getChannelHeaderMenuPluginComponents(state);

            expect(fourthResult).not.toBe(firstResult);
            expect(fourthResult).toEqual([
                state.plugins.components.ChannelHeader[0],
            ]);

            // A new plugin was added
            state = {
                ...state,
                plugins: {
                    ...state.plugins,
                    components: {
                        ...state.plugins.components,
                        ChannelHeader: [
                            ...state.plugins.components.ChannelHeader,
                            {
                                id: 'anotherPlugin',
                            } as ChannelHeaderAction,
                        ],
                    },
                },
            };

            const fifthResult = getChannelHeaderMenuPluginComponents(state);

            expect(fifthResult).not.toBe(fourthResult);
            expect(fifthResult).toEqual([
                state.plugins.components.ChannelHeader[0],
                state.plugins.components.ChannelHeader[1],
            ]);
        });
    });

    describe('getChannelMobileHeaderPluginButtons', () => {
        function makeState(mobileChannelHeaderButtons: MobileChannelHeaderButtonAction[]): GlobalState {
            const state: DeepPartial<GlobalState> = {
                plugins: {
                    components: {
                        MobileChannelHeaderButton: mobileChannelHeaderButtons,
                    },
                },
            };

            return state as GlobalState;
        }

        it('has no settings', () => {
            expect(getChannelMobileHeaderPluginButtons(makeState([]))).toEqual([]);
        });

        it('has settings', () => {
            const headerButton = {
                id: 'someid',
                pluginId: 'pluginid',
                dropdownText: 'some dropdown text',
            } as MobileChannelHeaderButtonAction;

            expect(getChannelMobileHeaderPluginButtons(makeState([headerButton]))).toEqual([headerButton]);
        });
    });
});
