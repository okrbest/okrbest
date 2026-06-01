// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import formatjsPlugin from 'eslint-plugin-formatjs';
import noOnlyTestsPlugin from 'eslint-plugin-no-only-tests';

import eslintPlugin from '@mattermost/eslint-plugin';

export default [
    ...eslintPlugin.configs.react,
    {
        plugins: {
            formatjs: formatjsPlugin,
        },
        rules: {
            'react/prop-types': [
                2,
                {
                    ignore: [
                        'location',
                        'history',
                        'component',
                    ],
                },
            ],
            'react/no-unknown-property': [
                2,
                {
                    ignore: [
                        'mask-type',
                    ],
                },
            ],
            'react/style-prop-object': [2, {
                allow: ['Timestamp'],
            }],
            'formatjs/enforce-default-message': 2,
            'formatjs/enforce-id': 2,
            'formatjs/enforce-placeholders': 2,
            'formatjs/no-invalid-icu': 2,
            'formatjs/no-multiple-plurals': 1,
            'formatjs/no-multiple-whitespaces': 2,
            'formatjs/no-literal-string-in-jsx': 1,
            'formatjs/prefer-formatted-message': 1,
            'formatjs/no-useless-message': 1,
            'formatjs/prefer-pound-in-plural': 0,
            'react/jsx-fragments': ['error', 'syntax'],
        },
    },
    {
        files: ['**/*.test.js', '**/*.test.jsx', '**/*.test.ts', '**/*.test.tsx'],
        plugins: {
            'no-only-tests': noOnlyTestsPlugin,
        },
        rules: {
            'no-only-tests/no-only-tests': ['error', {focus: ['only', 'skip']}],
        },
    },
    {
        files: [
            'src/actions/invite_actions.ts',
            'src/components/add_users_to_group_modal/add_users_to_group_modal.tsx',
            'src/components/admin_console/admin_definition.tsx',
            'src/components/admin_console/admin_definition_helpers.tsx',
            'src/components/admin_console/admin_definition_ldap_wizard.tsx',
            'src/components/admin_console/database_settings.tsx',
            'src/components/admin_console/elasticsearch_settings.tsx',
            'src/components/admin_console/feature_discovery/features/auto_translation.tsx',
            'src/components/admin_console/group_settings/group_settings.tsx',
            'src/components/admin_console/localization/auto_translation.tsx',
            'src/components/admin_console/permission_schemes_settings/permission_schemes_settings.tsx',
            'src/components/admin_console/request_button/request_button.tsx',
            'src/components/advanced_create_post/prewritten_chips.tsx',
            'src/components/cloud_usage_modal/lhs_nearing_limit_modal.tsx',
            'src/components/common/hooks/useShowAdminLimitReached.ts',
            'src/components/integrations/bots/bots.tsx',
            'src/components/integrations/installed_commands/installed_commands.tsx',
            'src/components/integrations/installed_incoming_webhooks/installed_incoming_webhooks.tsx',
            'src/components/integrations/installed_oauth_apps/installed_oauth_apps.tsx',
            'src/components/integrations/installed_outgoing_webhooks/installed_outgoing_webhooks.tsx',
            'src/components/integrations/outgoing_oauth_connections/installed_outgoing_oauth_connections.tsx',
            'src/components/rhs_plugin_popout/rhs_plugin_popout.tsx',
            'src/components/thread_popout/thread_popout.tsx',
            'src/components/widgets/menu/menu_items/useWords.tsx',
            'src/packages/mattermost-redux/src/utils/integration_utils.ts',
            'src/utils/utils.test.tsx',
        ],
        rules: {
            'formatjs/enforce-placeholders': 0,
        },
    },
    {
        ignores: ['src/packages/mattermost-redux/**'],
        rules: {
            '@typescript-eslint/no-restricted-imports': [
                'error',
                {
                    paths: [{
                        name: 'mattermost-redux/types/actions',
                        importNames: ['DispatchFunc', 'GetStateFunc', 'ActionFunc', 'ActionFuncAsync', 'ThunkActionFunc'],
                        message: 'Use the web app version of it from types/store',
                    }],
                    patterns: [{
                        group: ['@mattermost/client/src/*', '@mattermost/components/src/*', '@mattermost/types/src/*'],
                        message: "Don't include the src folder when importing from packages in webapp/platform",
                    }],
                },
            ],
        },
    },
    {
        settings: {
            'import/resolver': 'webpack',
            formatjs: {
                additionalFunctionNames: ['localizeMessage', 'defineMessage'],
            },
        },
    },
];
