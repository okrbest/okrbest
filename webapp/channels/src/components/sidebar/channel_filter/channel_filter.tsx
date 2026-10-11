// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import {defineMessages, injectIntl, FormattedMessage} from 'react-intl';
import type {IntlShape} from 'react-intl';

import {CheckIcon, ChevronDownIcon} from '@mattermost/compass-icons/components';
import {ShortcutKeys} from '@mattermost/shared/components/shortcut_key';

import * as Menu from 'components/menu';

import Constants from 'utils/constants';
import * as Keyboard from 'utils/keyboard';

const messages = defineMessages({
    filter: {
        id: 'sidebar_left.channel_filter.filter',
        defaultMessage: 'Filter',
    },
    showAllChannels: {
        id: 'sidebar_left.channel_filter.showAllChannels',
        defaultMessage: 'Show all channels',
    },
    filterByUnread: {
        id: 'sidebar_left.channel_filter.filterByUnread',
        defaultMessage: 'Filter by unread',
    },
});

const shortcut = {
    default: [ShortcutKeys.ctrl, ShortcutKeys.shift, 'U'],
    mac: [ShortcutKeys.cmd, ShortcutKeys.shift, 'U'],
};

type Props = {
    intl: IntlShape;
    unreadFilterEnabled: boolean;
    actions: {
        setUnreadFilterEnabled: (enabled: boolean) => void;
    };
};

// Slack 벤치마크(spec 019 measurements 18절) — 아이콘만으로는 기능이 안
// 읽힌다. "필터" 라벨+체브론을 노출하고, 옵션은 Menu v2 드롭다운으로 고른다
// (리스트 디자인은 020-8의 전역 메뉴 개선을 그대로 받는다).
export class ChannelFilter extends React.PureComponent<Props> {
    componentDidMount() {
        document.addEventListener('keydown', this.handleUnreadFilterKeyPress);
    }

    componentWillUnmount() {
        document.removeEventListener('keydown', this.handleUnreadFilterKeyPress);
    }

    handleUnreadFilterKeyPress = (e: KeyboardEvent) => {
        if (Keyboard.cmdOrCtrlPressed(e) && e.shiftKey && Keyboard.isKeyPressed(e, Constants.KeyCodes.U)) {
            e.preventDefault();
            e.stopPropagation();
            this.props.actions.setUnreadFilterEnabled(!this.props.unreadFilterEnabled);
        }
    };

    setFilter = (enabled: boolean) => {
        if (enabled !== this.props.unreadFilterEnabled) {
            this.props.actions.setUnreadFilterEnabled(enabled);
        }
    };

    render() {
        const {intl, unreadFilterEnabled} = this.props;

        const check = (
            <CheckIcon
                size={18}
                aria-hidden={true}
            />
        );

        return (
            <div className='SidebarFilters'>
                <Menu.Container
                    menuButton={{
                        id: 'sidebarFilterMenuButton',
                        dataTestId: 'sidebar-unread-filter-button',
                        class: 'SidebarFilters_filterButton',
                        'aria-label': intl.formatMessage({id: 'sidebar_left.channel_filter.filterUnreadAria', defaultMessage: 'unreads filter'}),
                        children: (
                            <>
                                <i
                                    className='icon icon-filter-variant'
                                    aria-hidden={true}
                                />
                                <span className='SidebarFilters_filterLabel'>
                                    {intl.formatMessage(messages.filter)}
                                </span>
                                <ChevronDownIcon
                                    size={14}
                                    aria-hidden={true}
                                />
                            </>
                        ),
                    }}
                    menuButtonTooltip={{
                        text: unreadFilterEnabled ? intl.formatMessage(messages.showAllChannels) : intl.formatMessage(messages.filterByUnread),
                        shortcut,
                    }}
                    menu={{
                        id: 'sidebarFilterMenu',
                        'aria-label': intl.formatMessage(messages.filter),
                    }}
                >
                    <Menu.Item
                        id='channelFilterShowAll'
                        aria-checked={!unreadFilterEnabled}
                        role='menuitemradio'
                        onClick={() => this.setFilter(false)}
                        labels={(
                            <FormattedMessage
                                id='sidebar_left.channel_filter.showAllChannels'
                                defaultMessage='Show all channels'
                            />
                        )}
                        trailingElements={!unreadFilterEnabled && (
                            <span data-testid='channelFilter-check-all'>{check}</span>
                        )}
                    />
                    <Menu.Item
                        id='channelFilterUnread'
                        aria-checked={unreadFilterEnabled}
                        role='menuitemradio'
                        onClick={() => this.setFilter(true)}
                        labels={(
                            <FormattedMessage
                                id='sidebar_left.channel_filter.filterByUnread'
                                defaultMessage='Filter by unread'
                            />
                        )}
                        trailingElements={unreadFilterEnabled && (
                            <span data-testid='channelFilter-check-unread'>{check}</span>
                        )}
                    />
                </Menu.Container>
            </div>
        );
    }
}

export default injectIntl(ChannelFilter);
