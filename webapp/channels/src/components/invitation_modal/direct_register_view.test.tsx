// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';

import {fireEvent, renderWithContext, screen, userEvent, waitFor} from 'tests/react_testing_utils';
import {isValidPassword} from 'utils/password';
import {TestHelper} from 'utils/test_helper';

import DirectRegisterView from './direct_register_view';

describe('DirectRegisterView', () => {
    const passwordConfig = {
        minimumLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireNumber: true,
        requireSymbol: true,
    };

    const baseProps = {
        currentTeam: TestHelper.getTeamMock({display_name: 'OKR팀'}),
        passwordConfig,
        registerMembers: jest.fn(),
        onDirtyChange: jest.fn(),
        headerClass: 'header',
        footerClass: 'footer',
        onClose: jest.fn(),
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders the single registration form with a disabled submit button', () => {
        renderWithContext(<DirectRegisterView {...baseProps}/>);

        expect(screen.getByTestId('direct-register-email')).toBeInTheDocument();
        expect(screen.getByTestId('direct-register-name')).toBeInTheDocument();
        expect(screen.getByTestId('direct-register-password')).toBeInTheDocument();
        expect(screen.getByTestId('direct-register-submit')).toBeDisabled();
    });

    it('enables submit only when email, name and password are valid', async () => {
        renderWithContext(<DirectRegisterView {...baseProps}/>);

        await userEvent.type(screen.getByTestId('direct-register-email'), 'not-an-email');
        await userEvent.type(screen.getByTestId('direct-register-name'), '홍길동');
        await userEvent.type(screen.getByTestId('direct-register-password'), 'Abcd!2345');
        expect(screen.getByTestId('direct-register-submit')).toBeDisabled();

        await userEvent.clear(screen.getByTestId('direct-register-email'));
        await userEvent.type(screen.getByTestId('direct-register-email'), 'hong@example.com');
        expect(screen.getByTestId('direct-register-submit')).toBeEnabled();
    });

    it('fills a policy-compliant password when generate is clicked', async () => {
        renderWithContext(<DirectRegisterView {...baseProps}/>);

        await userEvent.click(screen.getByTestId('direct-register-generate'));

        const password = (screen.getByTestId('direct-register-password') as HTMLInputElement).value;
        expect(password).not.toBe('');
        expect(isValidPassword(password, passwordConfig).valid).toBe(true);
    });

    it('submits a single registration row', async () => {
        renderWithContext(<DirectRegisterView {...baseProps}/>);

        await userEvent.type(screen.getByTestId('direct-register-email'), 'hong@example.com');
        await userEvent.type(screen.getByTestId('direct-register-name'), '홍길동');
        await userEvent.type(screen.getByTestId('direct-register-password'), 'Abcd!2345');
        await userEvent.click(screen.getByTestId('direct-register-submit'));

        await waitFor(() => {
            expect(baseProps.registerMembers).toHaveBeenCalledWith([{
                email: 'hong@example.com',
                name: '홍길동',
                password: 'Abcd!2345',
            }]);
        });
        expect(baseProps.onDirtyChange).toHaveBeenCalledWith(true);
    });
});

describe('DirectRegisterView CSV tab', () => {
    const passwordConfig = {
        minimumLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireNumber: true,
        requireSymbol: true,
    };

    const baseProps = {
        currentTeam: TestHelper.getTeamMock({display_name: 'OKR팀'}),
        passwordConfig,
        registerMembers: jest.fn(),
        onDirtyChange: jest.fn(),
        headerClass: 'header',
        footerClass: 'footer',
        onClose: jest.fn(),
    };

    const uploadCsv = async (content: string) => {
        await userEvent.click(screen.getByTestId('direct-register-tab-csv'));
        const file = new File([content], 'members.csv', {type: 'text/csv'});
        await userEvent.upload(screen.getByTestId('direct-register-file'), file);
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('shows a per-row validation preview, skips the header and submits only valid rows', async () => {
        renderWithContext(<DirectRegisterView {...baseProps}/>);

        await uploadCsv([
            '이메일,이름,임시비밀번호',
            'hong@example.com,홍길동,Abcd!2345',
            'not-an-email,형식오류,Abcd!2345',
            'hong@example.com,중복,Abcd!2345',
            'kim@example.com,김철수,short',
            'lee@example.com,이영희',
            'park@example.com,박민수,Qwer!2345',
        ].join('\n'));

        await waitFor(() => {
            expect(screen.getByTestId('direct-register-preview')).toBeInTheDocument();
        });

        const rows = screen.getAllByTestId(/direct-register-row-/);
        expect(rows).toHaveLength(6);

        const submit = screen.getByTestId('direct-register-csv-submit');
        expect(submit).toBeEnabled();
        await userEvent.click(submit);

        await waitFor(() => {
            expect(baseProps.registerMembers).toHaveBeenCalledWith([
                {email: 'hong@example.com', name: '홍길동', password: 'Abcd!2345'},
                {email: 'park@example.com', name: '박민수', password: 'Qwer!2345'},
            ]);
        });
    });

    it('shows a file-level error for an unparseable file', async () => {
        renderWithContext(<DirectRegisterView {...baseProps}/>);

        await uploadCsv('hong@example.com,"깨진 따옴표,Abcd!2345');

        await waitFor(() => {
            expect(screen.getByTestId('direct-register-file-error')).toBeInTheDocument();
        });
        expect(screen.queryByTestId('direct-register-csv-submit')).not.toBeInTheDocument();
    });

    it('shows a file-level error when rows exceed the cap', async () => {
        renderWithContext(<DirectRegisterView {...baseProps}/>);

        const lines = ['이메일,이름,임시비밀번호'];
        for (let i = 0; i < 257; i++) {
            lines.push(`user${i}@example.com,사용자${i},Abcd!2345`);
        }
        await uploadCsv(lines.join('\n'));

        await waitFor(() => {
            expect(screen.getByTestId('direct-register-file-error')).toBeInTheDocument();
        });
        expect(screen.queryByTestId('direct-register-csv-submit')).not.toBeInTheDocument();
    });

    it('offers a template download', async () => {
        renderWithContext(<DirectRegisterView {...baseProps}/>);

        await userEvent.click(screen.getByTestId('direct-register-tab-csv'));
        expect(screen.getByTestId('direct-register-template')).toBeInTheDocument();
    });
});

describe('DirectRegisterView CSV dropzone', () => {
    const passwordConfig = {
        minimumLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireNumber: true,
        requireSymbol: true,
    };

    const baseProps = {
        currentTeam: TestHelper.getTeamMock({display_name: 'OKR팀'}),
        passwordConfig,
        registerMembers: jest.fn(),
        onDirtyChange: jest.fn(),
        headerClass: 'header',
        footerClass: 'footer',
        onClose: jest.fn(),
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('shows a dropzone and the selected file name after choosing a file', async () => {
        renderWithContext(<DirectRegisterView {...baseProps}/>);

        await userEvent.click(screen.getByTestId('direct-register-tab-csv'));
        expect(screen.getByTestId('direct-register-dropzone')).toBeInTheDocument();

        const file = new File(['이메일,이름,임시비밀번호\nhong@example.com,홍길동,Abcd!2345'], 'members.csv', {type: 'text/csv'});
        await userEvent.upload(screen.getByTestId('direct-register-file'), file);

        await waitFor(() => {
            expect(screen.getByTestId('direct-register-dropzone')).toHaveTextContent('members.csv');
        });
    });

    it('accepts a file dropped onto the dropzone', async () => {
        renderWithContext(<DirectRegisterView {...baseProps}/>);

        await userEvent.click(screen.getByTestId('direct-register-tab-csv'));
        const dropzone = screen.getByTestId('direct-register-dropzone');
        const file = new File(['이메일,이름,임시비밀번호\nhong@example.com,홍길동,Abcd!2345'], 'dropped.csv', {type: 'text/csv'});

        fireEvent.drop(dropzone, {dataTransfer: {files: [file]}});

        await waitFor(() => {
            expect(screen.getByTestId('direct-register-preview')).toBeInTheDocument();
        });
        expect(screen.getByTestId('direct-register-csv-submit')).toBeEnabled();
    });
});
