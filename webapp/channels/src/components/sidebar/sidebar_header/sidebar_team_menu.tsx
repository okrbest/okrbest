// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useCallback} from 'react';
import {FormattedMessage} from 'react-intl';
import {useDispatch, useSelector} from 'react-redux';

import {
    AccountMultipleOutlineIcon,
    ApplicationCogIcon,
    InformationOutlineIcon,
    LightbulbOutlineIcon,
    AccountPlusOutlineIcon,
    AccountMultiplePlusOutlineIcon,
    SettingsOutlineIcon,
    ExitToAppIcon,
    MonitorAccountIcon,
    SitemapIcon,
    ViewGridPlusOutlineIcon,
    WebhookIncomingIcon,
} from '@mattermost/compass-icons/components';
import {buttonClassNames} from '@mattermost/shared/components/button';
import type {Team} from '@mattermost/types/teams';

import {Permissions} from 'mattermost-redux/constants';
import {getConfig, getLicense, isMarketplaceEnabled} from 'mattermost-redux/selectors/entities/general';
import {isCustomGroupsEnabled} from 'mattermost-redux/selectors/entities/preferences';
import {haveICurrentTeamPermission, haveISystemPermission as haveISystemPermissionFromRoles} from 'mattermost-redux/selectors/entities/roles';

import {openModal} from 'actions/views/modals';
import {getMainMenuPluginComponents} from 'selectors/plugins';

import AboutBuildModal from 'components/about_build_modal';
import AddGroupsToTeamModal from 'components/add_groups_to_team_modal';
import InvitationModal from 'components/invitation_modal';
import LeaveTeamModal from 'components/leave_team_modal';
import * as Menu from 'components/menu';
import SystemPermissionGate from 'components/permissions_gates/system_permission_gate';
import MarketplaceModal from 'components/plugin_marketplace/marketplace_modal';
import TeamGroupsManageModal from 'components/team_groups_manage_modal';
import TeamMembersModal from 'components/team_members_modal';
import TeamOrgRoleManagementModal from 'components/team_org_role_management_modal';
import TeamSettingsModal from 'components/team_settings_modal';
import UserGroupsModal from 'components/user_groups_modal';
import TeamListMenu from 'components/widgets/team_list_menu/team_list_menu';

import {ModalIdentifiers} from 'utils/constants';

import type {GlobalState} from 'types/store';

interface Props {
    currentTeam: Team;
}

export default function SidebarTeamMenu(props: Props) {
    const license = useSelector(getLicense);
    const config = useSelector(getConfig);

    const havePermissionToManageTeam = useSelector((state: GlobalState) => haveICurrentTeamPermission(state, Permissions.MANAGE_TEAM));
    const havePermissionToManageTeamRoles = useSelector((state: GlobalState) => haveICurrentTeamPermission(state, Permissions.MANAGE_TEAM_ROLES));
    const havePermissionToAddUserToTeam = useSelector((state: GlobalState) => haveICurrentTeamPermission(state, Permissions.ADD_USER_TO_TEAM));
    const havePermissionToInviteGuest = useSelector((state: GlobalState) => haveICurrentTeamPermission(state, Permissions.INVITE_GUEST));
    const isGuestAccessEnabled = config?.EnableGuestAccounts === 'true';
    const isTeamGroupConstrained = Boolean(props.currentTeam?.group_constrained);
    const isLicensedForLDAPGroups = license?.LDAPGroups === 'true';
    const experimentalPrimaryTeam = config.ExperimentalPrimaryTeam;

    const tooltipText = props.currentTeam.description ? props.currentTeam.description : props.currentTeam.display_name;

    return (
        <Menu.Container
            menuButton={{
                id: 'sidebarTeamMenuButton',
                class: buttonClassNames({emphasis: 'quaternary', size: 'sm'}, 'btn-inverted'),
                children: (
                    <>
                        <span>{props.currentTeam.display_name}</span>
                        <i className='icon icon-chevron-down'/>
                    </>
                ),
            }}
            menuButtonTooltip={{
                text: tooltipText,
            }}
            menu={{
                id: 'sidebarTeamMenu',
            }}
        >
            <TeamListMenu/>
            <Menu.Separator/>
            {((isGuestAccessEnabled && havePermissionToInviteGuest) || havePermissionToAddUserToTeam) && (
                <InvitePeopleMenuItem/>
            )}
            {isTeamGroupConstrained && isLicensedForLDAPGroups && havePermissionToManageTeam && (
                <AddGroupsToTeamMenuItem/>
            )}
            {havePermissionToManageTeam && (
                <TeamSettingsMenuItem/>
            )}
            {havePermissionToManageTeamRoles && (
                <TeamOrgRoleManagementMenuItem/>
            )}
            <ManageViewMembersMenuItem/>
            {(isTeamGroupConstrained && isLicensedForLDAPGroups && havePermissionToManageTeam) && (
                <ManageGroupsMenuItem
                    teamID={props.currentTeam.id}
                />
            )}
            {(!isTeamGroupConstrained && experimentalPrimaryTeam !== props.currentTeam.name) && (
                <LeaveTeamMenuItem/>
            )}
            <Menu.Separator/>
            <LearnAboutTeamsMenuItem/>
            <PluginMenuItems/>
            <Menu.Separator/>
            <AdminToolsSection currentTeam={props.currentTeam}/>
        </Menu.Container>
    );
}

function InvitePeopleMenuItem(props: Menu.FirstMenuItemProps) {
    const dispatch = useDispatch();

    const handleClick = useCallback(() => {
        dispatch(openModal({
            modalId: ModalIdentifiers.INVITATION,
            dialogType: InvitationModal,
            dialogProps: {
                focusOriginElement: 'sidebarTeamMenuButton',
            },
        }));
    }, [dispatch]);

    return (
        <Menu.Item
            onClick={handleClick}
            leadingElement={(
                <AccountMultiplePlusOutlineIcon
                    size={18}
                    aria-hidden='true'
                />
            )}
            labels={(
                <>
                    <FormattedMessage
                        id='sidebarLeft.teamMenu.invitePeopleMenuItem.primaryLabel'
                        defaultMessage='Invite people'
                    />
                    <FormattedMessage
                        id='sidebarLeft.teamMenu.invitePeopleMenuItem.secondaryLabel'
                        defaultMessage='Add or invite people to the team'
                    />
                </>
            )}
            aria-haspopup='dialog'
            {...props}
        />
    );
}

function AddGroupsToTeamMenuItem(props: Menu.FirstMenuItemProps) {
    const dispatch = useDispatch();

    const handleClick = useCallback(() => {
        dispatch(openModal({
            modalId: ModalIdentifiers.ADD_GROUPS_TO_TEAM,
            dialogType: AddGroupsToTeamModal,
            dialogProps: {
                focusOriginElement: 'sidebarTeamMenuButton',
            },
        }));
    }, [dispatch]);

    return (
        <Menu.Item
            onClick={handleClick}
            leadingElement={(
                <AccountPlusOutlineIcon
                    size={18}
                    aria-hidden='true'
                />
            )}
            labels={(
                <FormattedMessage
                    id='sidebarLeft.teamMenu.addGroupsToTeamMenuItem.primaryLabel'
                    defaultMessage='Add groups'
                />
            )}
            aria-haspopup='dialog'
            {...props}
        />
    );
}

function TeamSettingsMenuItem(props: Menu.FirstMenuItemProps) {
    const dispatch = useDispatch();

    const handleClick = useCallback(() => {
        dispatch(openModal({
            modalId: ModalIdentifiers.TEAM_SETTINGS,
            dialogType: TeamSettingsModal,
            dialogProps: {
                isOpen: true,
                focusOriginElement: 'sidebarTeamMenuButton',
            },
        }));
    }, [dispatch]);

    return (
        <Menu.Item
            leadingElement={(
                <SettingsOutlineIcon
                    size={18}
                    aria-hidden='true'
                />
            )}
            onClick={handleClick}
            labels={(
                <FormattedMessage
                    id='sidebarLeft.teamMenu.teamSettingsMenuItem.primaryLabel'
                    defaultMessage='Team settings'
                />
            )}
            aria-haspopup='dialog'
            {...props}
        />
    );
}

function TeamOrgRoleManagementMenuItem(props: Menu.FirstMenuItemProps) {
    const dispatch = useDispatch();

    const handleClick = useCallback(() => {
        dispatch(openModal({
            modalId: ModalIdentifiers.TEAM_ORG_ROLE_MANAGEMENT,
            dialogType: TeamOrgRoleManagementModal,
            dialogProps: {
                focusOriginElement: 'sidebarTeamMenuButton',
            },
        }));
    }, [dispatch]);

    return (
        <Menu.Item
            leadingElement={(
                <SitemapIcon
                    size={18}
                    aria-hidden='true'
                />
            )}
            onClick={handleClick}
            labels={(
                <FormattedMessage
                    id='sidebarLeft.teamMenu.orgRoleManagementMenuItem.primaryLabel'
                    defaultMessage='부서/직위 관리'
                />
            )}
            aria-haspopup='dialog'
            {...props}
        />
    );
}

function ManageViewMembersMenuItem(props: Menu.FirstMenuItemProps) {
    const dispatch = useDispatch();

    const havePermissionToRemoveUserFromTeam = useSelector((state: GlobalState) => haveICurrentTeamPermission(state, Permissions.REMOVE_USER_FROM_TEAM));
    const havePermissionToManageTeamRoles = useSelector((state: GlobalState) => haveICurrentTeamPermission(state, Permissions.MANAGE_TEAM_ROLES));

    const handleClick = useCallback(() => {
        dispatch(openModal({
            modalId: ModalIdentifiers.TEAM_MEMBERS,
            dialogType: TeamMembersModal,
            dialogProps: {
                focusOriginElement: 'sidebarTeamMenuButton',
            },
        }));
    }, [dispatch]);

    let label = (
        <FormattedMessage
            id='sidebarLeft.teamMenu.viewMembersMenuItem.primaryLabel'
            defaultMessage='View members'
        />
    );
    if (havePermissionToRemoveUserFromTeam && havePermissionToManageTeamRoles) {
        label = (
            <FormattedMessage
                id='sidebarLeft.teamMenu.manageMembersMenuItem.primaryLabel'
                defaultMessage='Manage members'
            />
        );
    }

    return (
        <Menu.Item
            leadingElement={(
                <AccountMultipleOutlineIcon
                    size={18}
                    aria-hidden='true'
                />
            )}
            onClick={handleClick}
            labels={label}
            aria-haspopup='dialog'
            {...props}
        />
    );
}

interface ManageGroupsMenuItemProps {
    teamID: Team['id'];
}

function ManageGroupsMenuItem({teamID}: ManageGroupsMenuItemProps) {
    const dispatch = useDispatch();

    const handleClick = useCallback(() => {
        dispatch(openModal({
            modalId: ModalIdentifiers.MANAGE_TEAM_GROUPS,
            dialogType: TeamGroupsManageModal,
            dialogProps: {
                teamID,
            },
        }));
    }, [dispatch, teamID]);

    return (
        <Menu.Item
            leadingElement={(
                <MonitorAccountIcon
                    size={18}
                    aria-hidden='true'
                />
            )}
            onClick={handleClick}
            labels={(
                <FormattedMessage
                    id='sidebarLeft.teamMenu.manageGroupsMenuItem.primaryLabel'
                    defaultMessage='Manage groups'
                />
            )}
            aria-haspopup='dialog'
        />
    );
}

function LeaveTeamMenuItem() {
    const dispatch = useDispatch();

    const handleClick = useCallback(() => {
        dispatch(openModal({
            modalId: ModalIdentifiers.LEAVE_TEAM,
            dialogType: LeaveTeamModal,
        }));
    }, [dispatch]);

    return (
        <Menu.Item
            leadingElement={(
                <ExitToAppIcon
                    size={18}
                    aria-hidden='true'
                />
            )}
            onClick={handleClick}
            isDestructive={true}
            labels={(
                <FormattedMessage
                    id='sidebarLeft.teamMenu.leaveTeamMenuItem.primaryLabel'
                    defaultMessage='Leave team'
                />
            )}
            aria-haspopup='dialog'
        />
    );
}

const MATTERMOST_ACADEMY_TEAM_TRAINING_LINK = 'https://mattermost.com/pl/mattermost-academy-team-training';

function LearnAboutTeamsMenuItem() {
    const handleClick = useCallback(() => {
        window.open(MATTERMOST_ACADEMY_TEAM_TRAINING_LINK, '_blank', 'noopener noreferrer');
    }, []);

    return (
        <Menu.Item
            className='learnAboutTeamsMenuItem'
            onClick={handleClick}
            leadingElement={(
                <LightbulbOutlineIcon
                    size={18}
                    aria-hidden='true'
                />
            )}
            labels={(
                <FormattedMessage
                    id='sidebarLeft.teamMenu.learnAboutTeamsMenuItem.primaryLabel'
                    defaultMessage='Learn about teams'
                />
            )}
        />
    );
}

function PluginMenuItems() {
    const pluginInMainMenu = useSelector(getMainMenuPluginComponents);

    if (pluginInMainMenu.length > 0) {
        const pluginMenuItems = pluginInMainMenu.map((plugin) => {
            function handleClick() {
                if (plugin.action) {
                    plugin.action();
                }
            }

            return (
                <Menu.Item
                    id={`${plugin.id}_pluginmenuitem`}
                    key={plugin.id}
                    onClick={handleClick}
                    labels={<span>{plugin.text}</span>}
                />
            );
        });

        return (
            <>
                <Menu.Separator/>
                {pluginMenuItems}
            </>
        );
    }

    return null;
}

// product switcher(제거됨)에서 이전한 관리 섹션 — 각 항목의 노출 조건은
// 기존 product_menu_list와 동일하다. 클라우드 요금제 전용 부속(RestrictedIndicator,
// CloudTrial)과 비활성화돼 있던 앱 다운로드 항목은 셀프호스트 포크에서 쓰이지
// 않아 이전하지 않았다.
function AdminToolsSection({currentTeam}: {currentTeam: Team}) {
    const dispatch = useDispatch();
    const config = useSelector(getConfig);

    const siteName = config.SiteName || 'Mattermost';
    const enableCommands = config.EnableCommands === 'true';
    const enableIncomingWebhooks = config.EnableIncomingWebhooks === 'true';
    const enableOAuthServiceProvider = config.EnableOAuthServiceProvider === 'true';
    const enableOutgoingWebhooks = config.EnableOutgoingWebhooks === 'true';
    const enablePluginMarketplace = useSelector(isMarketplaceEnabled);
    const enableCustomUserGroups = useSelector(isCustomGroupsEnabled);

    const canManageTeamIntegrations = useSelector((state: GlobalState) => (
        haveICurrentTeamPermission(state, Permissions.MANAGE_SLASH_COMMANDS) ||
        haveICurrentTeamPermission(state, Permissions.MANAGE_OWN_SLASH_COMMANDS) ||
        haveICurrentTeamPermission(state, Permissions.MANAGE_INCOMING_WEBHOOKS) ||
        haveICurrentTeamPermission(state, Permissions.MANAGE_OWN_INCOMING_WEBHOOKS) ||
        haveICurrentTeamPermission(state, Permissions.MANAGE_OUTGOING_WEBHOOKS) ||
        haveICurrentTeamPermission(state, Permissions.MANAGE_OWN_OUTGOING_WEBHOOKS) ||
        haveISystemPermissionFromRoles(state, {permission: Permissions.MANAGE_OAUTH})
    ));
    const canManageSystemBots = useSelector((state: GlobalState) => (
        haveISystemPermissionFromRoles(state, {permission: Permissions.MANAGE_BOTS}) ||
        haveISystemPermissionFromRoles(state, {permission: Permissions.MANAGE_OTHERS_BOTS})
    ));
    const canManageMarketplace = useSelector((state: GlobalState) => haveISystemPermissionFromRoles(state, {permission: Permissions.SYSCONSOLE_WRITE_PLUGINS}));

    const someIntegrationEnabled = enableIncomingWebhooks || enableOutgoingWebhooks || enableCommands || enableOAuthServiceProvider || canManageSystemBots;
    const showIntegrations = someIntegrationEnabled && (canManageTeamIntegrations || canManageSystemBots);

    const openUserGroupsModal = useCallback(() => {
        dispatch(openModal({
            modalId: ModalIdentifiers.USER_GROUPS,
            dialogType: UserGroupsModal,
        }));
    }, [dispatch]);

    const openMarketplaceModal = useCallback(() => {
        dispatch(openModal({
            modalId: ModalIdentifiers.PLUGIN_MARKETPLACE,
            dialogType: MarketplaceModal,
        }));
    }, [dispatch]);

    const openAboutModal = useCallback(() => {
        dispatch(openModal({
            modalId: ModalIdentifiers.ABOUT,
            dialogType: AboutBuildModal,
        }));
    }, [dispatch]);

    return (
        <>
            <SystemPermissionGate permissions={Permissions.SYSCONSOLE_READ_PERMISSIONS}>
                <Menu.LinkItem
                    id='sidebarTeamMenu-systemConsole'
                    to='/admin_console'
                    leadingElement={<ApplicationCogIcon size={18}/>}
                    labels={(
                        <FormattedMessage
                            id='navbar_dropdown.console'
                            defaultMessage='System Console'
                        />
                    )}
                />
            </SystemPermissionGate>
            {showIntegrations && (
                <Menu.LinkItem
                    id='sidebarTeamMenu-integrations'
                    to={`/${currentTeam.name}/integrations`}
                    leadingElement={<WebhookIncomingIcon size={18}/>}
                    labels={(
                        <FormattedMessage
                            id='navbar_dropdown.integrations'
                            defaultMessage='Integrations'
                        />
                    )}
                />
            )}
            {enableCustomUserGroups && (
                <Menu.Item
                    id='sidebarTeamMenu-userGroups'
                    onClick={openUserGroupsModal}
                    leadingElement={<AccountMultipleOutlineIcon size={18}/>}
                    labels={(
                        <FormattedMessage
                            id='navbar_dropdown.userGroups'
                            defaultMessage='User Groups'
                        />
                    )}
                />
            )}
            {enablePluginMarketplace && canManageMarketplace && (
                <Menu.Item
                    id='sidebarTeamMenu-marketplace'
                    onClick={openMarketplaceModal}
                    leadingElement={<ViewGridPlusOutlineIcon size={18}/>}
                    labels={(
                        <FormattedMessage
                            id='navbar_dropdown.marketplace'
                            defaultMessage='App Marketplace'
                        />
                    )}
                />
            )}
            <Menu.Item
                id='sidebarTeamMenu-about'
                onClick={openAboutModal}
                leadingElement={<InformationOutlineIcon size={18}/>}
                labels={(
                    <FormattedMessage
                        id='navbar_dropdown.about'
                        defaultMessage='About {appTitle}'
                        values={{appTitle: siteName}}
                    />
                )}
            />
        </>
    );
}
