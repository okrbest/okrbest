// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import classNames from 'classnames';
import React from 'react';
import type {MouseEvent, ReactNode, RefObject} from 'react';
import {FormattedMessage, injectIntl} from 'react-intl';
import type {WrappedComponentProps} from 'react-intl';

import {WithTooltip} from '@mattermost/shared/components/tooltip';

import CustomStatusEmoji from 'components/custom_status/custom_status_emoji';
import CustomStatusText from 'components/custom_status/custom_status_text';
import PopoutButton from 'components/popout_button';
import Timestamp from 'components/timestamp';
import Tag from 'components/widgets/tag/tag';

import CallButton from 'plugins/call_button';
import ChannelHeaderPlug from 'plugins/channel_header_plug';
import Pluggable from 'plugins/pluggable';
import {getChannelRoutePathAndIdentifier} from 'utils/channel_utils';
import {
    Constants,
    NotificationLevels,
    Preferences,
    RHSStates,
} from 'utils/constants';
import {canPopout, getPopoutChannelTitle, isChannelPopoutWindow, popoutChannel} from 'utils/popouts/popout_windows';
import {isEmptyObject} from 'utils/utils';

import ChannelHeaderTabs from './channel_header_tabs/channel_header_tabs';
import ChannelHeaderText from './channel_header_text';
import ChannelHeaderTitle from './channel_header_title';
import ChannelInfoButton from './channel_info_button';
import ChannelJoinRequestCountSync from './channel_join_request_count_sync';
import ChannelMemberStack from './channel_member_stack/channel_member_stack';

import ChannelHeaderMenu from '../channel_header_menu/channel_header_menu';

import type {PropsFromRedux} from './index';

export type Props = WrappedComponentProps & PropsFromRedux;

class ChannelHeader extends React.PureComponent<Props> {
    toggleFavoriteRef: RefObject<HTMLButtonElement>;

    constructor(props: Props) {
        super(props);
        this.toggleFavoriteRef = React.createRef();
    }

    componentDidMount() {
        this.props.actions.getCustomEmojisInText(this.props.channel ? this.props.channel.header : '');

        // Fetch remote names for shared channels on initial mount
        if (this.props.channel?.shared) {
            // Don't force refresh on initial load, use cached data if available
            this.props.actions.fetchChannelRemotes(this.props.channel.id);
        }
    }

    componentDidUpdate(prevProps: Props) {
        const header = this.props.channel ? this.props.channel.header : '';
        const prevHeader = prevProps.channel ? prevProps.channel.header : '';
        if (header !== prevHeader) {
            this.props.actions.getCustomEmojisInText(header);
        }

        // Fetch remote names when channel changes or when a channel becomes shared
        if (this.props.channel?.shared) {
            if (this.props.channel.id !== prevProps.channel?.id) {
                // For regular channel changes, use cached data if available
                this.props.actions.fetchChannelRemotes(this.props.channel.id);
            } else if (this.props.channel.shared !== prevProps.channel?.shared) {
                // Only force refresh when a channel's shared status changes
                this.props.actions.fetchChannelRemotes(this.props.channel.id, true);
            }
        }
    }

    unmute = () => {
        const {actions, channel, channelMember, currentUser} = this.props;

        if (!channelMember || !currentUser || !channel) {
            return;
        }

        const options = {mark_unread: NotificationLevels.ALL};
        actions.updateChannelNotifyProps(currentUser.id, channel.id, options);
    };

    toggleMute = () => {
        const {actions, channel, channelMember, currentUser, isChannelMuted} = this.props;

        if (!channelMember || !currentUser || !channel) {
            return;
        }

        const options = {mark_unread: isChannelMuted ? NotificationLevels.ALL : NotificationLevels.MENTION};
        actions.updateChannelNotifyProps(currentUser.id, channel.id, options);
    };

    toggleBotMessages = async () => {
        const {actions, channel, currentUser, showBotMessages} = this.props;

        if (!channel || !currentUser) {
            return;
        }

        const newValue = showBotMessages === 'true' ? 'false' : 'true';

        await actions.savePreferences(currentUser.id, [{
            user_id: currentUser.id,
            category: Preferences.CATEGORY_CHANNEL_BOT_MESSAGES,
            name: channel.id,
            value: newValue,
        }]);
    };

    showPinnedPosts = (e: MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        if (this.props.rhsState === RHSStates.PIN) {
            this.props.actions.closeRightHandSide();
        } else {
            this.props.actions.showPinnedPosts();
        }
    };

    showChannelFiles = () => {
        if (this.props.rhsState === RHSStates.CHANNEL_FILES) {
            this.props.actions.closeRightHandSide();
        } else if (this.props.channel) {
            this.props.actions.showChannelFiles(this.props.channel.id);
        }
    };

    popoutChannelView = () => {
        const {channel, team, dmUser, intl} = this.props;
        if (channel && team) {
            const {path, identifier} = getChannelRoutePathAndIdentifier(channel, dmUser?.username);
            popoutChannel(intl.formatMessage(getPopoutChannelTitle(channel.type)), team.name, path, identifier);
        }
    };

    toggleChannelMembersRHS = () => {
        if (this.props.rhsState === RHSStates.CHANNEL_MEMBERS) {
            this.props.actions.closeRightHandSide();
        } else if (this.props.channel) {
            this.props.actions.showChannelMembers(this.props.channel.id);
        }
    };

    renderCustomStatus = () => {
        const {customStatus, isCustomStatusEnabled, isCustomStatusExpired} = this.props;
        const isStatusSet = !isCustomStatusExpired && (customStatus?.text || customStatus?.emoji);
        if (!(isCustomStatusEnabled && isStatusSet)) {
            return null;
        }

        return (
            <div className='custom-emoji__wrapper'>
                <CustomStatusEmoji
                    userID={this.props.dmUser?.id}
                    showTooltip={true}
                    emojiStyle={{
                        verticalAlign: 'top',
                        margin: '0 4px 1px',
                    }}
                />
                <CustomStatusText
                    text={customStatus?.text}
                    className='custom-emoji__text'
                />
            </div>
        );
    };

    render() {
        const {
            team,
            currentUser,
            gmMembers,
            channel,
            channelMember,
            isChannelMuted,
            dmUser,
            hasGuests,
            hideGuestTags,
        } = this.props;
        if (!channel) {
            return null;
        }

        const ariaLabelChannelHeader = this.props.intl.formatMessage({id: 'accessibility.sections.channelHeader', defaultMessage: 'channel header region'});

        let hasGuestsText: ReactNode = '';
        if (hasGuests && !hideGuestTags) {
            hasGuestsText = (
                <span className='has-guest-header'>
                    <span tabIndex={0}>
                        <FormattedMessage
                            id='channel_header.channelHasGuests'
                            defaultMessage='Channel has guests'
                        />
                    </span>
                </span>
            );
        }

        let autotranslationMessage: ReactNode = '';
        if (this.props.isChannelAutotranslated) {
            autotranslationMessage = (
                <WithTooltip
                    title={this.props.intl.formatMessage({id: 'channel_header.autotranslationMessage.tooltip.title', defaultMessage: 'Auto-translation is enabled'})}
                    hint={this.props.intl.formatMessage({id: 'channel_header.autotranslationMessage.tooltip.hint', defaultMessage: 'This channel is being automatically translated to your language'})}
                >
                    <div
                        className='autotranslation-header'
                        data-testid='autotranslation-badge'
                    >
                        <Tag
                            text={this.props.intl.formatMessage({id: 'channel_header.autotranslationMessage', defaultMessage: 'Auto-translated'})}
                            icon={'translate'}
                            size='xs'
                            variant='default'
                        />
                    </div>
                </WithTooltip>
            );
        }

        if (isEmptyObject(channel) ||
            isEmptyObject(channelMember) ||
            isEmptyObject(currentUser) ||
            (!dmUser && channel.type === Constants.DM_CHANNEL)
        ) {
            // Use an empty div to make sure the header's height stays constant
            return (
                <div className='channel-header'/>
            );
        }

        const isDirect = (channel.type === Constants.DM_CHANNEL);
        const isGroup = (channel.type === Constants.GM_CHANNEL);

        if (isGroup) {
            if (hasGuests && !hideGuestTags) {
                hasGuestsText = (
                    <span className='has-guest-header'>
                        <FormattedMessage
                            id='channel_header.groupMessageHasGuests'
                            defaultMessage='This group message has guests'
                        />
                    </span>
                );
            }
        }

        let dmHeaderTextStatus: ReactNode;
        if (isDirect && !dmUser?.delete_at && !dmUser?.is_bot) {
            dmHeaderTextStatus = (
                <span className='header-status__text'>
                    {this.renderCustomStatus()}
                </span>
            );

            if (this.props.isLastActiveEnabled && this.props.lastActivityTimestamp && this.props.timestampUnits) {
                dmHeaderTextStatus = (
                    <span className='header-status__text'>
                        <span className='last-active__text'>
                            <FormattedMessage
                                id='channel_header.lastActive'
                                defaultMessage='Active {timestamp}'
                                values={{
                                    timestamp: (
                                        <Timestamp
                                            value={this.props.lastActivityTimestamp}
                                            units={this.props.timestampUnits}
                                            useTime={false}
                                            style={'short'}
                                        />
                                    ),
                                }}
                            />
                        </span>
                        {this.renderCustomStatus()}
                    </span>
                );
            }
        }

        const isBotMessagesVisible = this.props.showBotMessages === 'true';

        let memberListButton = null;
        if (!isDirect) {
            memberListButton = (
                <ChannelMemberStack
                    channelId={channel.id}
                    hasPendingJoinRequests={this.props.hasPendingJoinRequests}
                />
            );
        }

        const muteTrigger = (
            <WithTooltip
                title={isChannelMuted ? (
                    <FormattedMessage
                        id='channelHeader.unmute'
                        defaultMessage='Unmute'
                    />
                ) : (
                    <FormattedMessage
                        id='channelHeader.mute'
                        defaultMessage='Mute Channel'
                    />
                )}
            >
                <button
                    id='toggleMute'
                    data-testid='channelHeaderBellButton'
                    onClick={this.toggleMute}
                    className={classNames('channel-header__mute btn btn-icon btn-xs', {inactive: isChannelMuted})}
                    aria-label={this.props.intl.formatMessage(
                        isChannelMuted ? {id: 'channelHeader.unmute', defaultMessage: 'Unmute'} : {id: 'channelHeader.mute', defaultMessage: 'Mute Channel'},
                    )}
                >
                    <i
                        className={classNames('icon', isChannelMuted ? 'icon-bell-off-outline' : 'icon-bell-outline')}
                        aria-hidden={true}
                    />
                </button>
            </WithTooltip>
        );

        return (
            <div
                id='channel-header'
                aria-label={ariaLabelChannelHeader}
                role='banner'
                tabIndex={-1}
                data-channelid={`${channel.id}`}
                className='channel-header alt a11y__region'
                data-a11y-sort-order='8'
            >
                <ChannelJoinRequestCountSync/>
                <div className='flex-parent'>
                    <div className='flex-child'>
                        <div
                            id='channelHeaderInfo'
                            className='channel-header__info'
                        >
                            <div
                                className='channel-header__title dropdown'
                            >
                                <ChannelHeaderTitle
                                    dmUser={dmUser}
                                    gmMembers={gmMembers}
                                    remoteNames={this.props.remoteNames}
                                />
                                <div
                                    className='channel-header__icons'
                                >
                                    {muteTrigger}
                                    {memberListButton}
                                    <div
                                        className='channel-header__bot-filter'
                                        style={{display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '8px'}}
                                    >
                                        <input
                                            type='checkbox'
                                            id='channelHeaderBotMessagesCheckbox'
                                            checked={isBotMessagesVisible}
                                            onChange={this.toggleBotMessages}
                                        />
                                        <label
                                            htmlFor='channelHeaderBotMessagesCheckbox'
                                            style={{margin: 0, cursor: 'pointer', fontSize: '12px'}}
                                        >
                                            <FormattedMessage
                                                id='channel_header.botMessages'
                                                defaultMessage='봇 메세지'
                                            />
                                        </label>
                                    </div>
                                    <Pluggable
                                        pluggableName='ChannelHeaderIcon'
                                        channel={channel}
                                        channelMember={channelMember!}
                                    />
                                </div>
                                <div
                                    id='channelHeaderDescription'
                                    className='channel-header__description'
                                >
                                    {dmHeaderTextStatus}
                                    {hasGuestsText}
                                    {autotranslationMessage}
                                    <ChannelHeaderText
                                        teamId={team?.id}
                                        channel={channel}
                                        dmUser={dmUser}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                    <ChannelHeaderPlug
                        channel={channel}
                        channelMember={channelMember}
                    />
                    <CallButton/>
                    {canPopout() && !isChannelPopoutWindow() && (
                        <PopoutButton
                            className='channel-header__icon'
                            onClick={this.popoutChannelView}
                        />
                    )}
                    <ChannelInfoButton channel={channel}/>
                    <ChannelHeaderMenu
                        dmUser={dmUser}
                        gmMembers={gmMembers}
                        trigger='kebab'
                    />
                </div>
                <ChannelHeaderTabs channelId={channel.id}/>
            </div>
        );
    }
}

export default injectIntl(ChannelHeader);
