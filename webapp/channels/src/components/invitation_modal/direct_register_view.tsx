// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import classNames from 'classnames';
import React, {useCallback, useRef, useState} from 'react';
import {Modal} from 'react-bootstrap';
import {FormattedMessage, useIntl} from 'react-intl';

import {Button} from '@mattermost/shared/components/button';
import type {MemberRegistration, Team} from '@mattermost/types/teams';

import type {PasswordConfig} from 'mattermost-redux/selectors/entities/general';
import {isEmail} from 'mattermost-redux/utils/helpers';

import RadioGroup from 'components/common/radio_group';

import {parseCsv} from 'utils/csv';
import {isValidPassword} from 'utils/password';

import './direct_register_view.scss';

// Keep in sync with model.MemberRegistrationMaxRows on the server.
const MAX_CSV_ROWS = 256;

export const InviteMethod = {
    INVITE: 'invite',
    DIRECT: 'direct',
} as const;

export type InviteMethodType = typeof InviteMethod[keyof typeof InviteMethod];

const RegisterTab = {
    SINGLE: 'single',
    CSV: 'csv',
} as const;

type RegisterTabType = typeof RegisterTab[keyof typeof RegisterTab];

type InviteMethodSelectorProps = {
    method: InviteMethodType;
    onMethodChange: (method: InviteMethodType) => void;
};

export function InviteMethodSelector(props: InviteMethodSelectorProps) {
    return (
        <div className='DirectRegisterView__methodSelector'>
            <div className='InviteView__sectionTitle InviteView__sectionTitle--first'>
                <FormattedMessage
                    id='invite_modal.direct_register.method_title'
                    defaultMessage='How would you like to add members?'
                />
            </div>
            <RadioGroup
                id='invite-method'
                value={props.method}
                onChange={(e) => props.onMethodChange(e.target.value as InviteMethodType)}
                values={[
                    {
                        key: (
                            <FormattedMessage
                                id='invite_modal.direct_register.method_invite'
                                defaultMessage='Send invitations'
                            />
                        ),
                        value: InviteMethod.INVITE,
                        testId: 'invite-method-invite',
                    },
                    {
                        key: (
                            <FormattedMessage
                                id='invite_modal.direct_register.method_direct'
                                defaultMessage='Register directly'
                            />
                        ),
                        value: InviteMethod.DIRECT,
                        testId: 'invite-method-direct',
                    },
                ]}
            />
        </div>
    );
}

// generatePassword builds a random password that satisfies the server's
// password policy (minimum length plus every required character class).
export function generatePassword(config: PasswordConfig): string {
    const lower = 'abcdefghijkmnopqrstuvwxyz';
    const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const numbers = '23456789';
    const symbols = '!#$%&*+-=?@';

    const randomInt = (max: number): number => {
        const buffer = new Uint32Array(1);
        window.crypto.getRandomValues(buffer);
        return buffer[0] % max;
    };

    const required: string[] = [];
    if (config.requireLowercase) {
        required.push(lower);
    }
    if (config.requireUppercase) {
        required.push(upper);
    }
    if (config.requireNumber) {
        required.push(numbers);
    }
    if (config.requireSymbol) {
        required.push(symbols);
    }

    const pool = lower + upper + numbers + symbols;
    const length = Math.max(config.minimumLength || 0, 16);

    const chars = required.map((set) => set[randomInt(set.length)]);
    while (chars.length < length) {
        chars.push(pool[randomInt(pool.length)]);
    }
    for (let i = chars.length - 1; i > 0; i--) {
        const j = randomInt(i + 1);
        [chars[i], chars[j]] = [chars[j], chars[i]];
    }
    return chars.join('');
}

type CsvRowError = 'missing_fields' | 'invalid_email' | 'invalid_password' | 'duplicate';

type CsvRow = {
    email: string;
    name: string;
    password: string;
    error?: CsvRowError;
};

type CsvFileError = 'unparseable' | 'too_many_rows';

type CsvState = {
    fileError: CsvFileError | null;
    rows: CsvRow[];
};

// validateCsvRows turns parsed CSV cells into rows with local validation:
// column count, email format, required name, password policy and in-file
// duplicates (first occurrence wins). Whether an email belongs to an existing
// account is decided by the server and shown in the result view instead.
export function validateCsvRows(parsedRows: string[][], passwordConfig: PasswordConfig): CsvState {
    let dataRows = parsedRows;
    if (dataRows.length > 0 && !dataRows[0][0].includes('@')) {
        // Treat a first row without an email as the template header.
        dataRows = dataRows.slice(1);
    }

    if (dataRows.length > MAX_CSV_ROWS) {
        return {fileError: 'too_many_rows', rows: []};
    }

    const seen = new Set<string>();
    const rows = dataRows.map((cells): CsvRow => {
        const [email = '', name = '', password = ''] = cells.map((cell) => cell.trim());
        const row: CsvRow = {email, name, password};
        if (cells.length < 3 || email === '' || name === '' || password === '') {
            row.error = 'missing_fields';
            return row;
        }
        if (!isEmail(email)) {
            row.error = 'invalid_email';
            return row;
        }
        if (!isValidPassword(password, passwordConfig).valid) {
            row.error = 'invalid_password';
            return row;
        }
        const normalized = email.toLowerCase();
        if (seen.has(normalized)) {
            row.error = 'duplicate';
            return row;
        }
        seen.add(normalized);
        return row;
    });

    return {fileError: null, rows};
}

const csvRowErrorMessages: Record<CsvRowError, React.ReactNode> = {
    missing_fields: (
        <FormattedMessage
            id='invite_modal.direct_register.row_missing_fields'
            defaultMessage='Missing values'
        />
    ),
    invalid_email: (
        <FormattedMessage
            id='invite_modal.direct_register.row_invalid_email'
            defaultMessage='Invalid email format'
        />
    ),
    invalid_password: (
        <FormattedMessage
            id='invite_modal.direct_register.row_invalid_password'
            defaultMessage='Password does not meet the policy'
        />
    ),
    duplicate: (
        <FormattedMessage
            id='invite_modal.direct_register.row_duplicate'
            defaultMessage='Duplicate email in this file'
        />
    ),
};

export type Props = {
    currentTeam: Team;
    passwordConfig: PasswordConfig;
    registerMembers: (registrations: MemberRegistration[]) => Promise<void> | void;
    onDirtyChange: (dirty: boolean) => void;
    onMethodChange?: (method: InviteMethodType) => void;
    headerClass: string;
    footerClass: string;
    onClose: () => void;
};

export default function DirectRegisterView(props: Props) {
    const {formatMessage} = useIntl();

    const [tab, setTab] = useState<RegisterTabType>(RegisterTab.SINGLE);
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [csv, setCsv] = useState<CsvState | null>(null);
    const [csvFileName, setCsvFileName] = useState('');
    const [dragOver, setDragOver] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const {onDirtyChange} = props;
    const reportDirty = useCallback((nextEmail: string, nextName: string, nextPassword: string) => {
        onDirtyChange(nextEmail !== '' || nextName !== '' || nextPassword !== '');
    }, [onDirtyChange]);

    const isValid = isEmail(email.trim()) &&
        name.trim() !== '' &&
        isValidPassword(password, props.passwordConfig).valid;

    const submitSingle = async () => {
        if (!isValid || submitting) {
            return;
        }
        setSubmitting(true);
        try {
            await props.registerMembers([{
                email: email.trim(),
                name: name.trim(),
                password,
            }]);
        } finally {
            setSubmitting(false);
        }
    };

    const csvValidRows = csv?.rows.filter((row) => !row.error) ?? [];
    const csvErrorCount = (csv?.rows.length ?? 0) - csvValidRows.length;

    const submitCsv = async () => {
        if (csvValidRows.length === 0 || submitting) {
            return;
        }
        setSubmitting(true);
        try {
            await props.registerMembers(csvValidRows.map((row) => ({
                email: row.email,
                name: row.name,
                password: row.password,
            })));
        } finally {
            setSubmitting(false);
        }
    };

    const readCsvFile = (file: File) => {
        setCsvFileName(file.name);
        const reader = new FileReader();
        reader.onload = () => {
            const text = typeof reader.result === 'string' ? reader.result : '';
            const parsed = parseCsv(text);
            if (parsed.error) {
                setCsv({fileError: 'unparseable', rows: []});
            } else {
                setCsv(validateCsvRows(parsed.rows!, props.passwordConfig));
            }
            onDirtyChange(true);
        };
        reader.readAsText(file);
    };

    const onFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            readCsvFile(file);
        }
    };

    const downloadTemplate = () => {
        const header = formatMessage({
            id: 'invite_modal.direct_register.template_header',
            defaultMessage: 'email,name,temporary_password',
        });
        try {
            const blob = new Blob(['﻿' + header + '\n'], {type: 'text/csv;charset=utf-8'});
            const url = URL.createObjectURL(blob);
            const anchor = document.createElement('a');
            anchor.href = url;
            anchor.download = 'direct-register-template.csv';
            anchor.click();
            URL.revokeObjectURL(url);
        } catch {
            // Ignored: template download is a convenience and must not break the form.
        }
    };

    const singleForm = (
        <React.Fragment key='direct-register-single'>
            <div className='InviteView__sectionTitle'>
                <FormattedMessage
                    id='invite_modal.direct_register.email'
                    defaultMessage='Email (used to sign in)'
                />
            </div>
            <input
                className='form-control'
                type='email'
                data-testid='direct-register-email'
                value={email}
                placeholder='member@example.com'
                onChange={(e) => {
                    setEmail(e.target.value);
                    reportDirty(e.target.value, name, password);
                }}
            />
            <div className='InviteView__sectionTitle'>
                <FormattedMessage
                    id='invite_modal.direct_register.name'
                    defaultMessage='Name'
                />
            </div>
            <input
                className='form-control'
                type='text'
                data-testid='direct-register-name'
                value={name}
                onChange={(e) => {
                    setName(e.target.value);
                    reportDirty(email, e.target.value, password);
                }}
            />
            <div className='InviteView__sectionTitle'>
                <FormattedMessage
                    id='invite_modal.direct_register.password'
                    defaultMessage='Temporary password'
                />
            </div>
            <div className='DirectRegisterView__passwordRow'>
                <input
                    className='form-control'
                    type='text'
                    data-testid='direct-register-password'
                    value={password}
                    onChange={(e) => {
                        setPassword(e.target.value);
                        reportDirty(email, name, e.target.value);
                    }}
                />
                <Button
                    emphasis='tertiary'
                    data-testid='direct-register-generate'
                    onClick={() => {
                        const generated = generatePassword(props.passwordConfig);
                        setPassword(generated);
                        reportDirty(email, name, generated);
                    }}
                >
                    <FormattedMessage
                        id='invite_modal.direct_register.generate'
                        defaultMessage='Generate'
                    />
                </Button>
            </div>
        </React.Fragment>
    );

    const csvForm = (
        <React.Fragment key='direct-register-csv'>
            <div
                className={classNames('DirectRegisterView__dropzone', {'DirectRegisterView__dropzone--active': dragOver})}
                role='button'
                tabIndex={0}
                data-testid='direct-register-dropzone'
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        fileInputRef.current?.click();
                    }
                }}
                onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                    e.preventDefault();
                    setDragOver(false);
                    const file = e.dataTransfer?.files?.[0];
                    if (file) {
                        readCsvFile(file);
                    }
                }}
            >
                <div className='DirectRegisterView__dropzoneTitle'>
                    {csvFileName ? (
                        <FormattedMessage
                            id='invite_modal.direct_register.dropzone_selected'
                            defaultMessage='{filename} — click to choose a different file'
                            values={{filename: csvFileName}}
                        />
                    ) : (
                        <FormattedMessage
                            id='invite_modal.direct_register.dropzone'
                            defaultMessage='Drag and drop a CSV file here, or click to select one'
                        />
                    )}
                </div>
                <div className='DirectRegisterView__dropzoneHint'>
                    <FormattedMessage
                        id='invite_modal.direct_register.csv_file'
                        defaultMessage='CSV file (columns: email, name, temporary password)'
                    />
                </div>
                <input
                    ref={fileInputRef}
                    className='DirectRegisterView__fileInput'
                    type='file'
                    accept='.csv,text/csv'
                    data-testid='direct-register-file'
                    onClick={(e) => e.stopPropagation()}
                    onChange={onFileSelected}
                />
            </div>
            <div className='DirectRegisterView__templateRow'>
                <Button
                    emphasis='link'
                    data-testid='direct-register-template'
                    onClick={downloadTemplate}
                >
                    <FormattedMessage
                        id='invite_modal.direct_register.template'
                        defaultMessage='Download CSV template'
                    />
                </Button>
            </div>
            {csv?.fileError === 'unparseable' && (
                <div
                    className='DirectRegisterView__fileError'
                    data-testid='direct-register-file-error'
                >
                    <FormattedMessage
                        id='invite_modal.direct_register.file_unparseable'
                        defaultMessage='This file could not be read as CSV. Save it as UTF-8 CSV and try again.'
                    />
                </div>
            )}
            {csv?.fileError === 'too_many_rows' && (
                <div
                    className='DirectRegisterView__fileError'
                    data-testid='direct-register-file-error'
                >
                    <FormattedMessage
                        id='invite_modal.direct_register.file_too_many_rows'
                        defaultMessage='Too many rows in this file. Up to {max} members can be registered at once.'
                        values={{max: MAX_CSV_ROWS}}
                    />
                </div>
            )}
            {csv && !csv.fileError && (
                <div className='DirectRegisterView__previewScroll'>
                    <table
                        className='DirectRegisterView__preview'
                        data-testid='direct-register-preview'
                    >
                        <thead>
                            <tr>
                                <th>
                                    <FormattedMessage
                                        id='invite_modal.direct_register.email'
                                        defaultMessage='Email (used to sign in)'
                                    />
                                </th>
                                <th>
                                    <FormattedMessage
                                        id='invite_modal.direct_register.name'
                                        defaultMessage='Name'
                                    />
                                </th>
                                <th>
                                    <FormattedMessage
                                        id='invite_modal.direct_register.row_status'
                                        defaultMessage='Status'
                                    />
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {csv.rows.map((row, i) => (
                                <tr
                                    key={`${row.email}-${i}`}
                                    data-testid={`direct-register-row-${i}`}
                                >
                                    <td>{row.email}</td>
                                    <td>{row.name}</td>
                                    <td>
                                        {row.error ? csvRowErrorMessages[row.error] : (
                                            <FormattedMessage
                                                id='invite_modal.direct_register.row_valid'
                                                defaultMessage='Valid'
                                            />
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </React.Fragment>
    );

    return (
        <>
            <Modal.Header className={props.headerClass}>
                <h1
                    id='invitation_modal_title'
                    className='modal-title'
                >
                    <FormattedMessage
                        id='invite_modal.direct_register.title'
                        defaultMessage='Register members to {team_name}'
                        values={{team_name: props.currentTeam.display_name}}
                    />
                </h1>
                <button
                    id='closeIcon'
                    className='icon icon-close close'
                    aria-label={formatMessage({id: 'generic.close', defaultMessage: 'Close'})}
                    title={formatMessage({id: 'generic.close', defaultMessage: 'Close'})}
                    onClick={props.onClose}
                />
            </Modal.Header>
            <Modal.Body className='overflow-visible'>
                {props.onMethodChange && (
                    <InviteMethodSelector
                        method={InviteMethod.DIRECT}
                        onMethodChange={props.onMethodChange}
                    />
                )}
                <div
                    className='DirectRegisterView__tabs'
                    role='tablist'
                >
                    <Button
                        emphasis={tab === RegisterTab.SINGLE ? 'primary' : 'tertiary'}
                        data-testid='direct-register-tab-single'
                        aria-selected={tab === RegisterTab.SINGLE}
                        role='tab'
                        onClick={() => setTab(RegisterTab.SINGLE)}
                    >
                        <FormattedMessage
                            id='invite_modal.direct_register.tab_single'
                            defaultMessage='One member'
                        />
                    </Button>
                    <Button
                        emphasis={tab === RegisterTab.CSV ? 'primary' : 'tertiary'}
                        data-testid='direct-register-tab-csv'
                        aria-selected={tab === RegisterTab.CSV}
                        role='tab'
                        onClick={() => setTab(RegisterTab.CSV)}
                    >
                        <FormattedMessage
                            id='invite_modal.direct_register.tab_csv'
                            defaultMessage='CSV bulk registration'
                        />
                    </Button>
                </div>
                {tab === RegisterTab.SINGLE ? singleForm : csvForm}
            </Modal.Body>
            <Modal.Footer className={classNames('InviteView__footer', 'DirectRegisterView__footer', props.footerClass)}>
                {tab === RegisterTab.SINGLE ? (
                    <Button
                        emphasis='primary'
                        data-testid='direct-register-submit'
                        disabled={!isValid || submitting}
                        onClick={submitSingle}
                    >
                        <FormattedMessage
                            id='invite_modal.direct_register.submit'
                            defaultMessage='Create account and add to team'
                        />
                    </Button>
                ) : (
                    csv && !csv.fileError && (
                        <Button
                            emphasis='primary'
                            data-testid='direct-register-csv-submit'
                            disabled={csvValidRows.length === 0 || submitting}
                            onClick={submitCsv}
                        >
                            <FormattedMessage
                                id='invite_modal.direct_register.csv_submit'
                                defaultMessage='Register {validCount} members ({errorCount} rows excluded)'
                                values={{validCount: csvValidRows.length, errorCount: csvErrorCount}}
                            />
                        </Button>
                    )
                )}
            </Modal.Footer>
        </>
    );
}
