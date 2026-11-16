// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';

import type {ChannelWithTeamData} from '@mattermost/types/channels';

import {fireEvent, renderWithContext, screen, waitFor} from 'tests/react_testing_utils';

import ChannelList from './channel_list';

describe('components/admin_console/access_control/channel_list', () => {
    const mockSearchChannels = jest.fn();
    const mockSetChannelListSearch = jest.fn();
    const mockSetChannelListFilters = jest.fn();
    const mockOnRemoveCallback = jest.fn();
    const mockOnUndoRemoveCallback = jest.fn();
    const mockOnAddCallback = jest.fn();
    const mockOnPolicyActiveStatusChange = jest.fn();

    const channel1 = {
        id: 'channel1',
        name: 'channel1',
        display_name: 'Channel 1',
        team_display_name: 'Team 1',
        type: 'O',
        policy_auto_add: true,
    } as ChannelWithTeamData;
    const channel2 = {
        id: 'channel2',
        name: 'channel2',
        display_name: 'Channel 2',
        team_display_name: 'Team 2',
        type: 'P',
        policy_auto_add: false,
    } as ChannelWithTeamData;

    const defaultProps = {
        channels: [],
        totalCount: 2,
        searchTerm: '',
        filters: {},
        policyId: 'policy1',
        onRemoveCallback: mockOnRemoveCallback,
        onUndoRemoveCallback: mockOnUndoRemoveCallback,
        onAddCallback: mockOnAddCallback,
        channelsToRemove: {},
        channelsToAdd: {},
        onPolicyActiveStatusChange: mockOnPolicyActiveStatusChange,
        actions: {
            searchChannels: jest.fn().mockResolvedValue({
                data: {
                    channels: [
                        {id: 'channel1', name: 'Channel 1', display_name: 'Channel 1', team_display_name: 'Team 1', type: 'O'} as ChannelWithTeamData,
                        {id: 'channel2', name: 'channel2', display_name: 'Channel 2', team_display_name: 'Team 2', type: 'P'} as ChannelWithTeamData,
                    ],
                },
            }),
            setChannelListSearch: mockSetChannelListSearch,
            setChannelListFilters: mockSetChannelListFilters,
        },
    };

    beforeEach(() => {
        mockSearchChannels.mockReset();
        mockSetChannelListSearch.mockReset();
        mockSetChannelListFilters.mockReset();
        mockOnRemoveCallback.mockReset();
        mockOnUndoRemoveCallback.mockReset();
        mockOnAddCallback.mockReset();
        mockOnPolicyActiveStatusChange.mockReset();
    });

    // 포크는 Compass Checkbox 전환을 제외해 네이티브 체크박스를 쓴다 — data-testid 대신 id로 찾는다
    test('should render header checkbox with stable id and indeterminate when auto-add is mixed', async () => {
        const props = {
            ...defaultProps,
            channels: [channel1, channel2],
            totalCount: 2,
        };

        renderWithContext(<ChannelList {...props}/>);

        await waitFor(() => {
            expect(document.getElementById('auto-add-header-checkbox')).toBeInTheDocument();
        });

        const headerCheckbox = document.getElementById('auto-add-header-checkbox') as HTMLInputElement;
        expect(headerCheckbox).toBe(screen.getByRole('checkbox', {name: 'Auto-add members'}));
        expect(headerCheckbox).not.toBeChecked();
        expect(headerCheckbox.indeterminate).toBe(true);
    });

    test('should toggle per-row and header auto-add checkboxes', async () => {
        const props = {
            ...defaultProps,
            channels: [channel1, channel2],
            totalCount: 2,
        };

        renderWithContext(<ChannelList {...props}/>);

        await waitFor(() => {
            expect(document.getElementById('auto-add-checkbox-channel1')).toBeInTheDocument();
        });

        fireEvent.click(document.getElementById('auto-add-checkbox-channel1')!);
        expect(mockOnPolicyActiveStatusChange).toHaveBeenCalledWith([
            {id: 'channel1', active: false},
        ]);

        mockOnPolicyActiveStatusChange.mockClear();
        fireEvent.click(document.getElementById('auto-add-header-checkbox')!);
        expect(mockOnPolicyActiveStatusChange).toHaveBeenCalledWith([
            {id: 'channel1', active: true},
            {id: 'channel2', active: true},
        ]);
    });
});
