// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import nock from 'nock';

import Client4, {ClientError, HEADER_X_VERSION_ID} from './client4';
import {buildQueryString} from './helpers';

describe('Client4', () => {
    beforeAll(() => {
        if (!nock.isActive()) {
            nock.activate();
        }
    });

    afterAll(() => {
        nock.restore();
    });

    describe('content flagging routes', () => {
        let client: Client4;

        beforeEach(() => {
            client = new Client4();
            client.setUrl('http://mattermost.example.com');
        });

        test('flagPost should send comment as a plain string', async () => {
            let receivedBody: any;
            nock(client.getBaseRoute()).
                post('/content_flagging/post/post123/flag', (body) => {
                    receivedBody = body;
                    return true;
                }).
                reply(200, {status: 'OK'});

            await client.flagPost('post123', 'Spam', 'looks suspicious');

            expect(receivedBody).toEqual({reason: 'Spam', comment: 'looks suspicious'});
        });

        test('flagPost should preserve an empty comment as an empty string', async () => {
            let receivedBody: any;
            nock(client.getBaseRoute()).
                post('/content_flagging/post/post123/flag', (body) => {
                    receivedBody = body;
                    return true;
                }).
                reply(200, {status: 'OK'});

            await client.flagPost('post123', 'Spam', '');

            expect(receivedBody).toEqual({reason: 'Spam', comment: ''});
        });

        test('removeFlaggedPost should send comment as a plain string', async () => {
            let receivedBody: any;
            nock(client.getBaseRoute()).
                put('/content_flagging/post/post123/remove', (body) => {
                    receivedBody = body;
                    return true;
                }).
                reply(200, {status: 'OK'});

            await client.removeFlaggedPost('post123', 'violates policy');

            expect(receivedBody).toEqual({comment: 'violates policy'});
        });

        test('removeFlaggedPost should preserve an empty comment as an empty string', async () => {
            let receivedBody: any;
            nock(client.getBaseRoute()).
                put('/content_flagging/post/post123/remove', (body) => {
                    receivedBody = body;
                    return true;
                }).
                reply(200, {status: 'OK'});

            await client.removeFlaggedPost('post123', '');

            expect(receivedBody).toEqual({comment: ''});
        });

        test('keepFlaggedPost should send comment as a plain string', async () => {
            let receivedBody: any;
            nock(client.getBaseRoute()).
                put('/content_flagging/post/post123/keep', (body) => {
                    receivedBody = body;
                    return true;
                }).
                reply(200, {status: 'OK'});

            await client.keepFlaggedPost('post123', 'looks fine');

            expect(receivedBody).toEqual({comment: 'looks fine'});
        });

        test('keepFlaggedPost should preserve an empty comment as an empty string', async () => {
            let receivedBody: any;
            nock(client.getBaseRoute()).
                put('/content_flagging/post/post123/keep', (body) => {
                    receivedBody = body;
                    return true;
                }).
                reply(200, {status: 'OK'});

            await client.keepFlaggedPost('post123', '');

            expect(receivedBody).toEqual({comment: ''});
        });
    });

    describe('doFetchWithResponse', () => {
        test('serverVersion should be set from response header', async () => {
            const client = new Client4();
            client.setUrl('http://mattermost.example.com');

            expect(client.serverVersion).toEqual('');

            nock(client.getBaseRoute()).
                get('/users/me').
                reply(200, '{}', {[HEADER_X_VERSION_ID]: '5.0.0.5.0.0.abc123'});

            await client.getMe();

            expect(client.serverVersion).toEqual('5.0.0.5.0.0.abc123');

            nock(client.getBaseRoute()).
                get('/users/me').
                reply(200, '{}', {[HEADER_X_VERSION_ID]: '5.3.0.5.3.0.abc123'});

            await client.getMe();

            expect(client.serverVersion).toEqual('5.3.0.5.3.0.abc123');
        });

        test('should parse NDJSON responses correctly', async () => {
            const client = new Client4();
            client.setUrl('http://mattermost.example.com');

            const userId = 'dummy-user-id';
            const page = -1; // Special value to trigger NDJSON response

            // Sample NDJSON data with multiple channel memberships on separate lines
            const ndjsonData = '{"user_id":"dummy-user-id","channel_id":"channel1","roles":"channel_user"}\n' +
                '{"user_id":"dummy-user-id","channel_id":"channel2","roles":"channel_user channel_admin"}\n' +
                '{"user_id":"dummy-user-id","channel_id":"channel3","roles":"channel_user"}';

            // Create a mock endpoint for getAllChannelsMembers that returns NDJSON data
            nock(client.getBaseRoute()).
                get(`/users/${userId}/channel_members${buildQueryString({page, per_page: 60})}`).
                reply(200, ndjsonData, {'Content-Type': 'application/x-ndjson'});

            // Call the getAllChannelsMembers method which will use our implementation for NDJSON
            const result = await client.getAllChannelsMembers(userId, page);

            // Verify the response was parsed as an array of objects
            expect(Array.isArray(result)).toBe(true);
            expect(result).toHaveLength(3);
            expect(result[0]).toEqual({user_id: 'dummy-user-id', channel_id: 'channel1', roles: 'channel_user'});
            expect(result[1]).toEqual({user_id: 'dummy-user-id', channel_id: 'channel2', roles: 'channel_user channel_admin'});
            expect(result[2]).toEqual({user_id: 'dummy-user-id', channel_id: 'channel3', roles: 'channel_user'});
        });

        test('should parse ZIP responses as blobs', async () => {
            const client = new Client4();
            client.setUrl('http://mattermost.example.com');

            const postId = 'dummy-post-id';
            const zipData = Buffer.from('zip contents');

            nock(client.getBaseRoute()).
                post(`/content_flagging/post/${postId}/report`, {comment: 'investigation note'}).
                reply(200, zipData, {'Content-Type': 'application/zip'});

            const result = await client.generateFlaggedPostReport(postId, 'investigation note');

            expect(typeof result.text).toBe('function');
            expect(result.size).toEqual(zipData.length);
            expect(result.type).toEqual('application/zip');
            expect(await result.text()).toEqual('zip contents');
        });

        test('should send the reviewer decision when an action is given', async () => {
            const client = new Client4();
            client.setUrl('http://mattermost.example.com');

            const postId = 'dummy-post-id';

            nock(client.getBaseRoute()).
                post(`/content_flagging/post/${postId}/report`, {comment: 'note', action: 'remove'}).
                reply(200, Buffer.from('zip'), {'Content-Type': 'application/zip'});

            const result = await client.generateFlaggedPostReport(postId, 'note', 'remove');

            expect(result.type).toEqual('application/zip');
        });

        test('should abort an in-flight report request when the signal fires', async () => {
            const client = new Client4();
            client.setUrl('http://mattermost.example.com');

            const postId = 'dummy-post-id';

            nock(client.getBaseRoute()).
                post(`/content_flagging/post/${postId}/report`).
                delay(200).
                reply(200, Buffer.from('zip'), {'Content-Type': 'application/zip'});

            const controller = new AbortController();
            const pending = client.generateFlaggedPostReport(postId, '', undefined, controller.signal);
            controller.abort();

            await expect(pending).rejects.toBeDefined();
        });
    });
});

describe('ClientError', () => {
    test('standard fields should be enumerable', () => {
        const error = new ClientError('https://example.com', {
            message: 'This is a message',
            server_error_id: 'test.app_error',
            status_code: 418,
            url: 'https://example.com/api/v4/error',
        });

        const copy = {...error};

        expect(copy.message).toEqual(error.message);
        expect(copy.server_error_id).toEqual(error.server_error_id);
        expect(copy.status_code).toEqual(error.status_code);
        expect(copy.url).toEqual(error.url);
    });

    test('cause should be preserved when provided', () => {
        const cause = new Error('the original error');
        const error = new ClientError('https://example.com', {
            message: 'This is a message',
            server_error_id: 'test.app_error',
            status_code: 418,
            url: 'https://example.com/api/v4/error',
        }, cause);

        const copy = {...error};

        expect(copy.message).toEqual(error.message);
        expect(copy.server_error_id).toEqual(error.server_error_id);
        expect(copy.status_code).toEqual(error.status_code);
        expect(copy.url).toEqual(error.url);
        expect(error.cause).toEqual(cause);
    });
});

