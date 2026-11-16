// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';

import {renderWithContext, screen} from 'tests/react_testing_utils';

import AdminPanelTogglable from './admin_panel_togglable';

describe('components/widgets/admin_console/AdminPanelTogglable', () => {
    const defaultProps = {
        className: 'test-class-name',
        id: 'test-id',
        title: {id: 'test-title-id', defaultMessage: 'test-title-default'},
        subtitle: {
            id: 'test-subtitle-id',
            defaultMessage: 'test-subtitle-default',
        },
        open: true,
        onToggle: jest.fn(),
    };

    // 포크는 Compass 전환을 제외해 Compass collapse 클래스가 없다 — 포크의 closed 수식자와 내부 래퍼로 판정한다
    test('when expanded, panel has no closed modifier and keeps the inner content wrapper', () => {
        renderWithContext(
            <AdminPanelTogglable {...defaultProps}>
                {'Test'}
            </AdminPanelTogglable>,
        );

        const panel = document.getElementById('test-id');
        expect(panel).toHaveClass('AdminPanel', 'AdminPanelTogglable', 'test-class-name');
        expect(panel).not.toHaveClass('closed');
        expect(screen.getByText('test-title-default')).toBeInTheDocument();
        expect(screen.getByText('test-subtitle-default')).toBeInTheDocument();

        const inner = panel?.querySelector('.AdminPanelTogglableContent > .AdminPanelTogglableContentInner');
        expect(inner).toHaveTextContent('Test');
    });

    test('when collapsed, panel gets the closed modifier', () => {
        renderWithContext(
            <AdminPanelTogglable
                {...defaultProps}
                open={false}
            >
                {'Test'}
            </AdminPanelTogglable>,
        );

        const panel = document.getElementById('test-id');
        expect(panel).toHaveClass('AdminPanelTogglable', 'closed');
        expect(panel?.querySelector('.AdminPanelTogglableContentInner')).not.toBeNull();
    });
});
