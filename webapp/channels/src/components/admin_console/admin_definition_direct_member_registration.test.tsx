// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import AdminDefinition from './admin_definition';
import type {AdminDefinitionSetting} from './types';

describe('AdminDefinition - Enable Direct Member Registration setting', () => {
    const getSignupSettings = () => {
        const signupSection = AdminDefinition.authentication.subsections.signup;
        const settings = 'settings' in signupSection.schema! ? signupSection.schema.settings : undefined;

        return settings || [];
    };

    const getSetting = () => {
        return getSignupSettings().find((setting: AdminDefinitionSetting) => setting.key === 'TeamSettings.EnableDirectMemberRegistration');
    };

    test('exists as a bool setting in Authentication > Signup', () => {
        const setting = getSetting();

        expect(setting).toBeDefined();
        expect(setting?.type).toBe('bool');
        expect(setting?.label).toBeDefined();
        expect(setting?.help_text).toBeDefined();
    });

    test('is disabled for console users without signup write permission', () => {
        const setting = getSetting();

        expect(setting?.isDisabled).toBeDefined();
    });
});
