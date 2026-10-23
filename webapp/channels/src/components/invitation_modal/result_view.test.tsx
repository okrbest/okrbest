// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';

import {renderWithContext, screen, userEvent, waitFor} from 'tests/react_testing_utils';

import {InviteType} from './invite_as';
import ResultView from './result_view';

describe('ResultView direct register', () => {
    const baseProps = {
        inviteType: InviteType.MEMBER,
        currentTeamName: 'OKR팀',
        onDone: jest.fn(),
        inviteMore: jest.fn(),
        headerClass: 'header',
        footerClass: 'footer',
        error: false,
        sent: [
            {email: 'hong@example.com', reason: {id: 'invite.members.registered', defaultMessage: 'An account has been created and added to the team.'}},
        ],
        notSent: [
            {email: 'lee@example.com', reason: 'row failed'},
        ],
    };

    const registrations = [
        {email: 'hong@example.com', name: '홍길동', password: 'Abcd!2345'},
        {email: 'lee@example.com', name: '이영희', password: 'Qwer!2345'},
    ];

    it('does not show the download button for the invite flow', () => {
        renderWithContext(<ResultView {...baseProps}/>);
        expect(screen.queryByTestId('result-download-csv')).not.toBeInTheDocument();
    });

    it('downloads a result CSV including temporary passwords', async () => {
        const createObjectURL = jest.fn((_blob: Blob) => 'blob:mock');
        const revokeObjectURL = jest.fn();
        window.URL.createObjectURL = createObjectURL;
        window.URL.revokeObjectURL = revokeObjectURL;

        renderWithContext(
            <ResultView
                {...baseProps}
                directRegister={true}
                registrations={registrations}
            />,
        );

        await userEvent.click(screen.getByTestId('result-download-csv'));

        await waitFor(() => {
            expect(createObjectURL).toHaveBeenCalledTimes(1);
        });
        const blob = createObjectURL.mock.calls[0][0] as Blob;
        const text = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result));
            reader.onerror = reject;
            reader.readAsText(blob);
        });
        expect(text).toContain('hong@example.com,홍길동,Abcd!2345');
        expect(text).toContain('lee@example.com,이영희,Qwer!2345');
        expect(text).toContain('row failed');
    });
});
