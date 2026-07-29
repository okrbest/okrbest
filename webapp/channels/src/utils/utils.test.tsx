// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import * as i18nSelectors from 'selectors/i18n';

import {FileTypes} from './constants';
import {getFileType, localizeMessage} from './utils';

describe('Utils.localizeMessage', () => {
    jest.spyOn(i18nSelectors, 'getCurrentLocale').mockReturnValue('en');

    afterEach(() => {
        jest.spyOn(i18nSelectors, 'getTranslations').mockReset();
    });

    test('should substitute values into the translated string', () => {
        jest.spyOn(i18nSelectors, 'getTranslations').mockReturnValue({
            'test.min_max': 'Must be {min}-{max} characters long.',
        });

        const actual = localizeMessage({
            id: 'test.min_max',
            defaultMessage: 'fallback',
            values: {min: 3, max: 22},
        });

        expect(actual).toBe('Must be 3-22 characters long.');
    });

    test('should substitute values into the default message when untranslated', () => {
        jest.spyOn(i18nSelectors, 'getTranslations').mockReturnValue({});

        const actual = localizeMessage({
            id: 'test.unknown',
            defaultMessage: 'Must be {min}-{max} characters long.',
            values: {min: 3, max: 22},
        });

        expect(actual).toBe('Must be 3-22 characters long.');
    });

    test('should return the raw string unchanged when no values are given', () => {
        jest.spyOn(i18nSelectors, 'getTranslations').mockReturnValue({
            'test.plain': 'Plain text',
        });

        expect(localizeMessage({id: 'test.plain', defaultMessage: 'fallback'})).toBe('Plain text');
    });
});

describe('Utils.getFileType', () => {
    test('should identify image files by extension', () => {
        expect(getFileType('jpg')).toBe(FileTypes.IMAGE);
        expect(getFileType('png')).toBe(FileTypes.IMAGE);
        expect(getFileType('gif')).toBe(FileTypes.IMAGE);
        expect(getFileType('bmp')).toBe(FileTypes.IMAGE);
        expect(getFileType('tiff')).toBe(FileTypes.IMAGE);
    });

    test('should identify image files from URLs with extensions', () => {
        expect(getFileType('https://example.com/image.jpg')).toBe(FileTypes.IMAGE);
        expect(getFileType('https://example.com/path/to/image.png')).toBe(FileTypes.IMAGE);
        expect(getFileType('https://example.com/image.gif?query=param')).toBe(FileTypes.IMAGE);
        expect(getFileType('http://example.com/image.bmp#fragment')).toBe(FileTypes.IMAGE);
    });

    test('should identify image files from URLs without extensions', () => {
        // Test URLs with /api/v4/image and ?url= parameter
        expect(getFileType('/api/v4/image?url=https://example.com/image-without-extension')).toBe(FileTypes.IMAGE);
        expect(getFileType('https://mattermost.com/api/v4/image?url=https://example.com/another-image')).toBe(FileTypes.IMAGE);

        // Test URLs with /api/v4/image and &url= parameter (in case it's not the first parameter)
        expect(getFileType('/api/v4/image?param=value&url=https://example.com/image')).toBe(FileTypes.IMAGE);
        expect(getFileType('https://mattermost.com/api/v4/image?param=value&url=https://example.com/image')).toBe(FileTypes.IMAGE);
    });

    test('should identify image files from proxied URLs', () => {
        expect(getFileType('/api/v4/image?url=https://example.com/image.jpg')).toBe(FileTypes.IMAGE);
        expect(getFileType('https://mattermost.com/api/v4/image?url=https://example.com/image.png')).toBe(FileTypes.IMAGE);
    });

    test('should handle invalid image URLs gracefully', () => {
        // These are not valid URLs but should still be processed correctly
        expect(getFileType('path/to/image.jpg')).toBe(FileTypes.IMAGE);
        expect(getFileType('image.png')).toBe(FileTypes.IMAGE);
    });

    test('should identify other file types correctly', () => {
        expect(getFileType('doc')).toBe(FileTypes.WORD);
        expect(getFileType('pdf')).toBe(FileTypes.PDF);
        expect(getFileType('mp3')).toBe(FileTypes.AUDIO);
        expect(getFileType('mp4')).toBe(FileTypes.VIDEO);
        expect(getFileType('js')).toBe(FileTypes.CODE);
        expect(getFileType('txt')).toBe(FileTypes.TEXT);
    });

    test('should handle null or undefined input', () => {
        expect(getFileType(null as any)).toBe(FileTypes.OTHER);
        expect(getFileType(undefined as any)).toBe(FileTypes.OTHER);
        expect(getFileType('')).toBe(FileTypes.OTHER);
    });
});
