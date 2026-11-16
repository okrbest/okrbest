// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';

import {fakeDate} from 'tests/helpers/date';
import {defaultIntl} from 'tests/helpers/intl-test-helper';
import {renderWithContext, screen, act} from 'tests/react_testing_utils';
import {LicenseSkus} from 'utils/constants';

import LicenseSettings from './license_settings';

describe('components/admin_console/license_settings/LicenseSettings', () => {
    let resetFakeDate: {(): void};

    beforeAll(() => {
        resetFakeDate = fakeDate(new Date('2021-04-14T12:00:00Z'));
    });

    afterAll(() => {
        resetFakeDate();
    });

    const defaultProps: React.ComponentProps<typeof LicenseSettings> = {
        intl: defaultIntl,
        isDisabled: false,
        license: {
            IsLicensed: 'true',
            IssuedAt: '1517714643650',
            StartsAt: '1517714643650',
            ExpiresAt: '1620335443650',
            SkuShortName: LicenseSkus.E20,
            Name: 'LicenseName',
            Company: 'Mattermost Inc.',
            Users: '100',
        },
        prevTrialLicense: {
            IsLicensed: 'false',
        },
        upgradedFromTE: false,
        enterpriseReady: true,
        totalUsers: 10,
        environmentConfig: {},
        actions: {
            getLicenseConfig: jest.fn(),
            uploadLicense: jest.fn(),
            removeLicense: jest.fn(),
            upgradeToE0: jest.fn(),
            ping: jest.fn(),
            restartServer: jest.fn(),
            getPrevTrialLicense: jest.fn(),
            upgradeToE0Status: jest.fn().mockImplementation(() => Promise.resolve({percentage: 0, error: null})),
            openModal: jest.fn(),
            getFilteredUsersStats: jest.fn(),
            getServerLimits: jest.fn(),
            isAllowedToUpgradeToEnterprise: jest.fn().mockImplementation(() => Promise.resolve({})),
        },
    };

    test('upgrade to enterprise click', async () => {
        const promise = Promise.resolve({});
        const actions = {
            ...defaultProps.actions,
            getLicenseConfig: jest.fn(),
            upgradeToE0: jest.fn(),
            upgradeToE0Status: jest.fn().mockImplementation(() => Promise.resolve({percentage: 0, error: null})),
            isAllowedToUpgradeToEnterprise: jest.fn().mockImplementation(() => promise),
        };
        const props = {...defaultProps, enterpriseReady: false, actions};
        renderWithContext(<LicenseSettings {...props}/>);

        await act(async () => {
            await promise;
        });

        expect(actions.getLicenseConfig).toHaveBeenCalledTimes(1);
        expect(actions.upgradeToE0Status).toHaveBeenCalledTimes(1);
        actions.upgradeToE0Status = jest.fn().mockImplementation(() => Promise.resolve({percentage: 1, error: null}));

        // Find and click the upgrade button
        const upgradeButton = screen.getByRole('button', {name: /Upgrade to Enterprise Edition/i});
        expect(upgradeButton).toBeInTheDocument();

        await act(async () => {
            upgradeButton.click();
        });

        expect(actions.upgradeToE0).toHaveBeenCalledTimes(1);
    });
});
