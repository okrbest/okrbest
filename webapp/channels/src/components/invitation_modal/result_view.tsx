// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import classNames from 'classnames';
import React from 'react';
import {Modal} from 'react-bootstrap';
import {FormattedMessage, useIntl} from 'react-intl';

import {Button} from '@mattermost/shared/components/button';
import type {MemberRegistration} from '@mattermost/types/teams';

import deepFreeze from 'mattermost-redux/utils/deep_freeze';

import {serializeCsv} from 'utils/csv';

import {InviteType} from './invite_as';
import ResultTable from './result_table';
import type {InviteResult} from './result_table';

export type InviteResults = {
    sent: InviteResult[];
    notSent: InviteResult[];
};

export type ResultState = {
    sent: InviteResult[];
    notSent: InviteResult[];
    error: boolean;
};

export const defaultResultState = deepFreeze({
    sent: [],
    error: false,
    notSent: [],
});

type Props = {
    inviteType: InviteType;
    directRegister?: boolean;

    // The rows the admin submitted (including temporary passwords), kept so
    // the result CSV can hand the credentials over to the registered members.
    registrations?: MemberRegistration[];
    currentTeamName: string;
    onDone: () => void;
    headerClass: string;
    footerClass: string;
    inviteMore: () => void;
} & ResultState;

export default function ResultView(props: Props) {
    const {formatMessage} = useIntl();

    const reasonToText = (reason: InviteResult['reason']): string => {
        if (typeof reason === 'string') {
            return reason;
        }
        return formatMessage(reason, 'values' in reason ? reason.values as Record<string, string> : undefined);
    };

    const findByEmail = (rows: InviteResult[], email: string): InviteResult | undefined => {
        return rows.find((row) => 'email' in row && row.email === email);
    };

    const downloadResultCsv = () => {
        if (!props.registrations?.length) {
            return;
        }
        const header = [
            formatMessage({id: 'invite_modal.direct_register.csv_header_email', defaultMessage: 'email'}),
            formatMessage({id: 'invite_modal.direct_register.csv_header_name', defaultMessage: 'name'}),
            formatMessage({id: 'invite_modal.direct_register.csv_header_password', defaultMessage: 'temporary_password'}),
            formatMessage({id: 'invite_modal.direct_register.csv_header_result', defaultMessage: 'result'}),
            formatMessage({id: 'invite_modal.direct_register.csv_header_reason', defaultMessage: 'reason'}),
        ];
        const rows = props.registrations.map((registration) => {
            const sentRow = findByEmail(props.sent, registration.email);
            const notSentRow = findByEmail(props.notSent, registration.email);
            const result = sentRow ?
                formatMessage({id: 'invite_modal.direct_register.result_ok', defaultMessage: 'Registered'}) :
                formatMessage({id: 'invite_modal.direct_register.result_failed', defaultMessage: 'Failed'});
            const reason = sentRow ?? notSentRow;
            return [
                registration.email,
                registration.name,
                registration.password,
                result,
                reason ? reasonToText(reason.reason) : '',
            ];
        });
        const blob = new Blob([serializeCsv([header, ...rows])], {type: 'text/csv;charset=utf-8'});
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = 'direct-register-results.csv';
        anchor.click();
        URL.revokeObjectURL(url);
    };
    let inviteType;
    if (props.inviteType === InviteType.MEMBER) {
        inviteType = (
            <FormattedMessage
                id='invite_modal.invited_members'
                defaultMessage='Members'
            />
        );
    } else {
        inviteType = (
            <FormattedMessage
                id='invite_modal.invited_guests'
                defaultMessage='Guests'
            />
        );
    }

    return (
        <>
            <Modal.Header className={props.headerClass}>
                <h1
                    id='invitation_modal_title'
                    className='modal-title'
                >
                    {props.directRegister ? (
                        <FormattedMessage
                            id='invite_modal.registered'
                            defaultMessage='Members registered to {team_name}'
                            values={{team_name: props.currentTeamName}}
                        />
                    ) : (
                        <FormattedMessage
                            id='invite_modal.invited'
                            defaultMessage='{inviteType} invited to {team_name}'
                            values={{
                                inviteType,
                                team_name: props.currentTeamName,
                            }}
                        />
                    )}
                </h1>
            </Modal.Header>
            <Modal.Body>
                {props.notSent.length > 0 && (
                    <ResultTable
                        sent={false}
                        rows={props.notSent}
                    />
                )}
                {props.sent.length > 0 && (
                    <ResultTable
                        sent={true}
                        rows={props.sent}
                    />
                )}
            </Modal.Body>
            <Modal.Footer className={classNames('InviteView__footer', props.footerClass)}>
                {props.directRegister && Boolean(props.registrations?.length) && (
                    <Button
                        onClick={downloadResultCsv}
                        emphasis='tertiary'
                        data-testid='result-download-csv'
                    >
                        <FormattedMessage
                            id='invite_modal.direct_register.download_results'
                            defaultMessage='Download result CSV'
                        />
                    </Button>
                )}
                <Button
                    onClick={props.inviteMore}
                    emphasis='tertiary'
                    data-testid='invite-more'
                >
                    <FormattedMessage
                        id='invitation_modal.invite.more'
                        defaultMessage='Invite More People'
                    />
                </Button>
                <Button
                    onClick={props.onDone}
                    emphasis='primary'
                    data-testid='confirm-done'
                    aria-label={formatMessage({id: 'generic.close', defaultMessage: 'Close'})}
                    title={formatMessage({id: 'generic.close', defaultMessage: 'Close'})}
                >
                    <FormattedMessage
                        id='invitation_modal.confirm.done'
                        defaultMessage='Done'
                    />
                </Button>
            </Modal.Footer>
        </>
    );
}
