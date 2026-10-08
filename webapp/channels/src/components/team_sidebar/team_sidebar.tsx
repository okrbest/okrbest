// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import classNames from 'classnames';
import React from 'react';
import {injectIntl} from 'react-intl';
import type {WrappedComponentProps} from 'react-intl';
import type {RouteComponentProps} from 'react-router-dom';

import type {Team} from '@mattermost/types/teams';

import Scrollbars from 'components/common/scrollbars';
import SidebarFooter from 'components/sidebar/sidebar_footer';
import RailProductButton from 'components/team_sidebar/components/rail_product_button';
import RailTeamButton from 'components/team_sidebar/components/rail_team_button';

import WebSocketClient from 'client/web_websocket_client';
import Pluggable from 'plugins/pluggable';
import {Constants} from 'utils/constants';
import * as Keyboard from 'utils/keyboard';
import {getCurrentProduct} from 'utils/products';
import {filterAndSortTeamsByDisplayName} from 'utils/team_utils';

import type {PropsFromRedux} from './index';

export interface Props extends PropsFromRedux, WrappedComponentProps {
    location: RouteComponentProps['location'];
}

export class TeamSidebar extends React.PureComponent<Props> {
    // OKR.BEST: 채널 사이드바가 접힌 상태에서 레일 호버로 임시 공개(peek)한다.
    // 레일을 떠날 때는 사이드바로 건너가는 중일 수 있어 잠시 기다렸다가,
    // 둘 다 호버가 아니면 닫는다.
    peekCloseTimer: ReturnType<typeof setTimeout> | null = null;

    handleRailMouseEnter = () => {
        if (this.peekCloseTimer) {
            clearTimeout(this.peekCloseTimer);
            this.peekCloseTimer = null;
        }
        if (this.props.channelSidebarCollapsed) {
            this.props.actions.setChannelSidebarPeek(true);
        }
    };

    handleRailMouseLeave = () => {
        if (!this.props.channelSidebarCollapsed) {
            return;
        }
        this.peekCloseTimer = setTimeout(() => {
            const stillHovered = document.querySelector('.team-sidebar:hover, #SidebarContainer:hover');
            if (!stillHovered) {
                this.props.actions.setChannelSidebarPeek(false);
            }
        }, 150);
    };

    switchToPrevOrNextTeam = (e: KeyboardEvent, currentTeamId: string, teams: Team[]) => {
        if (Keyboard.isKeyPressed(e, Constants.KeyCodes.UP) || Keyboard.isKeyPressed(e, Constants.KeyCodes.DOWN)) {
            e.preventDefault();
            const delta = Keyboard.isKeyPressed(e, Constants.KeyCodes.DOWN) ? 1 : -1;
            const pos = teams.findIndex((team: Team) => team.id === currentTeamId);
            const newPos = pos + delta;

            let team;
            if (newPos === -1) {
                team = teams[teams.length - 1];
            } else if (newPos === teams.length) {
                team = teams[0];
            } else {
                team = teams[newPos];
            }

            this.props.actions.switchTeam(`/${team.name}`);
            return true;
        }
        return false;
    };

    switchToTeamByNumber = (e: KeyboardEvent, currentTeamId: string, teams: Team[]) => {
        const digits = [
            Constants.KeyCodes.ONE,
            Constants.KeyCodes.TWO,
            Constants.KeyCodes.THREE,
            Constants.KeyCodes.FOUR,
            Constants.KeyCodes.FIVE,
            Constants.KeyCodes.SIX,
            Constants.KeyCodes.SEVEN,
            Constants.KeyCodes.EIGHT,
            Constants.KeyCodes.NINE,
            Constants.KeyCodes.ZERO,
        ];

        for (const idx in digits) {
            if (Keyboard.isKeyPressed(e, digits[idx]) && parseInt(idx, 10) < teams.length) {
                e.preventDefault();

                // prevents reloading the current team, while still capturing the keyboard shortcut
                if (teams[idx].id === currentTeamId) {
                    return false;
                }
                const team = teams[idx];
                this.props.actions.switchTeam(`/${team.name}`);
                return true;
            }
        }
        return false;
    };

    handleKeyDown = (e: KeyboardEvent) => {
        if ((e.ctrlKey || e.metaKey) && e.altKey) {
            const {currentTeamId} = this.props;
            const teams = filterAndSortTeamsByDisplayName(this.props.myTeams, this.props.locale, this.props.userTeamsOrderPreference);

            if (this.switchToPrevOrNextTeam(e, currentTeamId, teams)) {
                return;
            }

            this.switchToTeamByNumber(e, currentTeamId, teams);
        }
    };

    componentDidUpdate(prevProps: Props) {
        // TODO: debounce
        if (prevProps.currentTeamId !== this.props.currentTeamId) {
            WebSocketClient.updateActiveTeam(this.props.currentTeamId);
        }
    }

    componentDidMount() {
        // for_directory: the "join another team" indicator is a discovery surface,
        // so policy-governed teams the user can't join are hidden here too — even
        // for admins, who are otherwise exempt on the System Console listing.
        this.props.actions.getTeams(0, 200, false, false, true);
        document.addEventListener('keydown', this.handleKeyDown);
    }

    componentWillUnmount() {
        document.removeEventListener('keydown', this.handleKeyDown);
    }

    render() {
        const root: Element | null = document.querySelector('#root');

        // OKR.BEST (Slack 벤치마크): 팀 레일은 팀이 1개여도 항상 표시한다 —
        // 하단 프로필 버튼 등 레일 상주 버튼의 거치대 역할.
        root!.classList.add('multi-teams');

        const plugins = [];

        const currentProduct = getCurrentProduct(this.props.products, this.props.location.pathname);
        if (currentProduct && !currentProduct.showTeamSidebar) {
            return null;
        }

        // Slack식 기능 버튼 레일: Channels 고정 버튼 + 등록된 제품(Boards·Playbooks 등).
        // 목적지는 기존 product switcher와 동일 — Channels는 '/'(라우터가 기본 채널로 보냄),
        // 제품은 등록된 switcherLinkURL.
        const productButtons = [
            <RailProductButton
                key='rail-product-channels'
                id='railProduct-channels'
                icon='product-channels'
                text='Channels'
                destination='/'
                active={!currentProduct}
            />,
            ...this.props.products.map((product) => (
                <RailProductButton
                    key={`rail-product-${product.id}`}
                    id={`railProduct-${product.pluginId || product.id}`}
                    icon={product.switcherIcon}
                    text={product.switcherText}
                    destination={product.switcherLinkURL}
                    active={currentProduct?.id === product.id}
                />
            )),
        ];

        // Disable team sidebar pluggables in products until proper support can be provided.
        const isNonChannelsProduct = !currentProduct;
        if (isNonChannelsProduct) {
            plugins.push(
                <div
                    key='team-sidebar-bottom-plugin'
                    className='team-sidebar-bottom-plugin is-empty'
                >
                    <Pluggable pluggableName='BottomTeamSidebar'/>
                </div>,
            );
        }

        return (
            <div
                className={classNames('team-sidebar', {'move--right': this.props.isOpen})}
                role='navigation'
                aria-labelledby='teamSidebarWrapper'
                onMouseEnter={this.handleRailMouseEnter}
                onMouseLeave={this.handleRailMouseLeave}
            >
                <Scrollbars>
                    <div
                        className='team-wrapper'
                        id='teamSidebarWrapper'
                    >
                        <RailTeamButton/>
                        <div className='rail-products'>
                            {productButtons}
                        </div>
                    </div>
                </Scrollbars>
                {plugins}
                {/* OKR.BEST: 프로필 버튼이 레일 최하단 — 플러그인 슬롯(BottomTeamSidebar)보다 뒤에 둔다 */}
                <SidebarFooter/>
            </div>
        );
    }
}

export default injectIntl(TeamSidebar);
