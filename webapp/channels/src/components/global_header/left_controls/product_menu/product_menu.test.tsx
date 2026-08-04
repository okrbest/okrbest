// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';

import {renderWithContext, screen} from 'tests/react_testing_utils';
import {TopLevelProducts} from 'utils/constants';
import * as productUtils from 'utils/products';
import {TestHelper} from 'utils/test_helper';

import ProductMenu from './product_menu';

jest.mock('./product_branding', () => {
    return function MockProductBranding() {
        return <div data-testid='product-branding'/>;
    };
});

jest.mock('./product_branding_team_edition', () => {
    return function MockProductBrandingFreeEdition() {
        return <div data-testid='product-branding-free-edition'/>;
    };
});

jest.mock('./product_menu_list', () => {
    return function MockProductMenuList() {
        return <div data-testid='product-menu-list'/>;
    };
});

jest.mock('components/onboarding_tasks', () => ({
    OnboardingTaskCategory: 'onboardingTask',
    OnboardingTasksName: {VISIT_SYSTEM_CONSOLE: 'visit_system_console'},
    TaskNameMapToSteps: {visit_system_console: {FINISHED: 999}},
    useHandleOnBoardingTaskData: () => jest.fn(),
}));

const spyProduct = jest.spyOn(productUtils, 'useCurrentProductId');
spyProduct.mockReturnValue(null);

describe('components/global/product_switcher', () => {
    beforeEach(() => {
        const products = [
            TestHelper.makeProduct(TopLevelProducts.BOARDS),
            TestHelper.makeProduct(TopLevelProducts.PLAYBOOKS),
        ];
        const spyProducts = jest.spyOn(productUtils, 'useProducts');
        spyProducts.mockReturnValue(products);
    });

    const baseState = {
        entities: {
            general: {
                license: {
                    IsLicensed: 'true',
                },
            },
        },
        views: {
            productMenu: {
                switcherOpen: false,
            },
        },
    };

    it('should match snapshot', () => {
        const {container} = renderWithContext(
            <ProductMenu/>,
            baseState,
        );

        expect(container).toMatchSnapshot();
    });

    // No tests for the free/team-edition branding switch (Entry license, unlicensed): okrbest's
    // product_menu.tsx doesn't wire it yet (upstream commit 75c48eabfb "Refactor ProductBranding
    // component to separate free and licensed editions" is not in our history) - ProductBranding
    // always renders regardless of license.

    it('should render once when there are no top level products available', () => {
        const state = {
            ...baseState,
            views: {
                ...baseState.views,
                productMenu: {
                    switcherOpen: true,
                },
            },
        };

        const {container} = renderWithContext(
            <ProductMenu/>,
            state,
        );

        const spyProducts = jest.spyOn(productUtils, 'useProducts');
        spyProducts.mockReturnValue([]);

        const menuItems = screen.getAllByRole('menuitem');
        expect(menuItems.length).toBeGreaterThanOrEqual(1);
        expect(menuItems.at(0)).toBeDefined();
        expect(container).toMatchSnapshot();
    });

    it('should render the correct amount of times when there are products available', () => {
        const state = {
            ...baseState,
            views: {
                ...baseState.views,
                productMenu: {
                    switcherOpen: true,
                },
            },
        };

        const products = [
            TestHelper.makeProduct(TopLevelProducts.BOARDS),
            TestHelper.makeProduct(TopLevelProducts.PLAYBOOKS),
        ];

        const spyProducts = jest.spyOn(productUtils, 'useProducts');
        spyProducts.mockReturnValue(products);

        const {container} = renderWithContext(
            <ProductMenu/>,
            state,
        );

        // Channels + 2 products
        expect(screen.getAllByRole('menuitem')).toHaveLength(3);
        expect(container).toMatchSnapshot();
    });

    it('should have an active button state when the switcher menu is open', () => {
        const state = {
            ...baseState,
            views: {
                ...baseState.views,
                productMenu: {
                    switcherOpen: true,
                },
            },
        };

        const {container} = renderWithContext(
            <ProductMenu/>,
            state,
        );

        const button = screen.getByRole('button', {name: 'Product switch menu'});
        expect(button).toHaveAttribute('aria-expanded', 'true');
        expect(container).toMatchSnapshot();
    });

    it('should match snapshot with product switcher menu', () => {
        const state = {
            ...baseState,
            views: {
                ...baseState.views,
                productMenu: {
                    switcherOpen: true,
                },
            },
        };

        const {container} = renderWithContext(
            <ProductMenu/>,
            state,
        );

        expect(screen.getByTestId('product-menu-list')).toBeInTheDocument();
        expect(container).toMatchSnapshot();
    });

    it('should render ProductBranding for Professional license', () => {
        const state = {
            ...baseState,
            entities: {
                ...baseState.entities,
                general: {
                    ...baseState.entities.general,
                    license: {
                        IsLicensed: 'true',
                        SkuShortName: 'professional',
                    },
                },
            },
        };

        renderWithContext(
            <ProductMenu/>,
            state,
        );

        expect(screen.getByTestId('product-branding')).toBeInTheDocument();
        expect(screen.queryByTestId('product-branding-free-edition')).not.toBeInTheDocument();
    });

    it('should render ProductBranding for Enterprise license', () => {
        const state = {
            ...baseState,
            entities: {
                ...baseState.entities,
                general: {
                    ...baseState.entities.general,
                    license: {
                        IsLicensed: 'true',
                        SkuShortName: 'enterprise',
                    },
                },
            },
        };

        renderWithContext(
            <ProductMenu/>,
            state,
        );

        expect(screen.getByTestId('product-branding')).toBeInTheDocument();
        expect(screen.queryByTestId('product-branding-free-edition')).not.toBeInTheDocument();
    });
});
