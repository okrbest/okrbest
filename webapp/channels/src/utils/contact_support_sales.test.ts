// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {buildMMURL} from './contact_support_sales';

describe('utils/contact_support_sales', () => {
    describe('buildMMURL', () => {
        const baseURL = 'https://okr.best/contact-sales/';

        // The base64 of each field is what the caller-facing links carry, so assert on the encoded form.
        const encodedFields = 'qk=Zmlyc3Q=&qp=bGFzdA==&qw=Q29tcGFueQ==&qx=dXNlckBleGFtcGxlLmNvbQ==';

        it('encodes the form fields', () => {
            expect(buildMMURL(baseURL, 'first', 'last', 'Company', 'user@example.com', 'mattermost', 'in-product')).
                toBe(`${baseURL}?${encodedFields}&utm_source=mattermost&utm_medium=in-product`);
        });

        it('omits tracking parameters when they are absent', () => {
            // useExternalLink returns no query parameters for domains it does not track, so useOpenSalesLink passes
            // undefined through. Appending them anyway would put the literal string "undefined" in the link.
            expect(buildMMURL(baseURL, 'first', 'last', 'Company', 'user@example.com', undefined, undefined)).
                toBe(`${baseURL}?${encodedFields}`);
        });

        it('omits only the tracking parameter that is absent', () => {
            expect(buildMMURL(baseURL, 'first', 'last', 'Company', 'user@example.com', 'mattermost', undefined)).
                toBe(`${baseURL}?${encodedFields}&utm_source=mattermost`);
            expect(buildMMURL(baseURL, 'first', 'last', 'Company', 'user@example.com', undefined, 'in-product')).
                toBe(`${baseURL}?${encodedFields}&utm_medium=in-product`);
        });

        it('encodes empty fields as empty strings', () => {
            expect(buildMMURL(baseURL, '', '', '', '')).toBe(`${baseURL}?qk=&qp=&qw=&qx=`);
        });
    });
});
