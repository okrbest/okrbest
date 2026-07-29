// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import type {IntlShape} from 'react-intl';
import {FormattedMessage, defineMessages} from 'react-intl';

import type {PasswordConfig} from 'mattermost-redux/selectors/entities/general';

import Constants from 'utils/constants';

export function isValidPassword(password: string, passwordConfig: PasswordConfig, intl?: IntlShape) {
    let errorKey = 'passwordError';
    let valid = true;
    const minimumLength = passwordConfig.minimumLength || Constants.MIN_PASSWORD_LENGTH;

    if (password.length < minimumLength || password.length > Constants.MAX_PASSWORD_LENGTH) {
        valid = false;
    }

    if (passwordConfig.requireLowercase) {
        if (!password.match(/[a-z]/)) {
            valid = false;
        }

        errorKey += 'Lowercase';
    }

    if (passwordConfig.requireUppercase) {
        if (!password.match(/[A-Z]/)) {
            valid = false;
        }

        errorKey += 'Uppercase';
    }

    if (passwordConfig.requireNumber) {
        if (!password.match(/[0-9]/)) {
            valid = false;
        }

        errorKey += 'Number';
    }

    if (passwordConfig.requireSymbol) {
        if (!password.match(/[ !"\\#$%&'()*+,-./:;<=>?@[\]^_`|~]/)) {
            valid = false;
        }

        errorKey += 'Symbol';
    }

    let error;
    if (!valid) {
        // errorKey is always one of the statically-defined passwordErrors keys below
        // (every combination of the four requirements is enumerated there), so this
        // reuses the already-extracted, requirement-specific message descriptors
        // instead of declaring a new dynamically-keyed one (which formatjs/@formatjs/cli
        // cannot statically resolve an id for).
        const descriptor = passwordErrors[errorKey as keyof typeof passwordErrors];
        error = intl ? (
            intl.formatMessage(
                descriptor,
                {
                    min: minimumLength,
                    max: Constants.MAX_PASSWORD_LENGTH,
                },
            )
        ) : (
            <FormattedMessage
                id={descriptor.id}
                defaultMessage={descriptor.defaultMessage}
                values={{
                    min: minimumLength,
                    max: Constants.MAX_PASSWORD_LENGTH,
                }}
            />
        );
    }

    return {valid, error};
}

export const passwordErrors = defineMessages({
    passwordError: {id: 'user.settings.security.passwordError', defaultMessage: 'Your password must be {min}-{max} characters long.'},
    passwordErrorLowercase: {id: 'user.settings.security.passwordErrorLowercase', defaultMessage: 'Your password must be {min}-{max} characters long and include lowercase letters.'},
    passwordErrorLowercaseNumber: {id: 'user.settings.security.passwordErrorLowercaseNumber', defaultMessage: 'Your password must be {min}-{max} characters long and include lowercase letters and numbers.'},
    passwordErrorLowercaseNumberSymbol: {id: 'user.settings.security.passwordErrorLowercaseNumberSymbol', defaultMessage: 'Your password must be {min}-{max} characters long and include lowercase letters, numbers, and special characters.'},
    passwordErrorLowercaseSymbol: {id: 'user.settings.security.passwordErrorLowercaseSymbol', defaultMessage: 'Your password must be {min}-{max} characters long and include lowercase letters and special characters.'},
    passwordErrorLowercaseUppercase: {id: 'user.settings.security.passwordErrorLowercaseUppercase', defaultMessage: 'Your password must be {min}-{max} characters long and include both lowercase and uppercase letters.'},
    passwordErrorLowercaseUppercaseNumber: {id: 'user.settings.security.passwordErrorLowercaseUppercaseNumber', defaultMessage: 'Your password must be {min}-{max} characters long and include both lowercase and uppercase letters, and numbers.'},
    passwordErrorLowercaseUppercaseNumberSymbol: {id: 'user.settings.security.passwordErrorLowercaseUppercaseNumberSymbol', defaultMessage: 'Your password must be {min}-{max} characters long and include both lowercase and uppercase letters, numbers, and special characters.'},
    passwordErrorLowercaseUppercaseSymbol: {id: 'user.settings.security.passwordErrorLowercaseUppercaseSymbol', defaultMessage: 'Your password must be {min}-{max} characters long and include both lowercase and uppercase letters, and special characters.'},
    passwordErrorNumber: {id: 'user.settings.security.passwordErrorNumber', defaultMessage: 'Your password must be {min}-{max} characters long and include numbers.'},
    passwordErrorNumberSymbol: {id: 'user.settings.security.passwordErrorNumberSymbol', defaultMessage: 'Your password must be {min}-{max} characters long and include numbers and special characters.'},
    passwordErrorSymbol: {id: 'user.settings.security.passwordErrorSymbol', defaultMessage: 'Your password must be {min}-{max} characters long and include special characters.'},
    passwordErrorUppercase: {id: 'user.settings.security.passwordErrorUppercase', defaultMessage: 'Your password must be {min}-{max} characters long and include uppercase letters.'},
    passwordErrorUppercaseNumber: {id: 'user.settings.security.passwordErrorUppercaseNumber', defaultMessage: 'Your password must be {min}-{max} characters long and include uppercase letters, and numbers.'},
    passwordErrorUppercaseNumberSymbol: {id: 'user.settings.security.passwordErrorUppercaseNumberSymbol', defaultMessage: 'Your password must be {min}-{max} characters long and include uppercase letters, numbers, and special characters.'},
    passwordErrorUppercaseSymbol: {id: 'user.settings.security.passwordErrorUppercaseSymbol', defaultMessage: 'Your password must be {min}-{max} characters long and include uppercase letters, and special characters.'},
});
