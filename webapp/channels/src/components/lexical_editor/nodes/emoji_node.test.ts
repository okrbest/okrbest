// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {createEditor} from 'lexical';

import {$createEmojiNode, $isEmojiNode, EmojiNode} from './emoji_node';

describe('EmojiNode', () => {
    it('should return unicode text content for system emojis', () => {
        const editor = createEditor({nodes: [EmojiNode]});
        editor.update(
            () => {
                const node = $createEmojiNode('thumbsup', '👍');
                expect($isEmojiNode(node)).toBe(true);
                expect(node.isCustomEmoji()).toBe(false);
                expect(node.getTextContent()).toBe('👍');
                expect(node.getEmojiName()).toBe('thumbsup');
            },
            {discrete: true},
        );
    });

    it('should return shortcode text content for custom emojis', () => {
        const editor = createEditor({nodes: [EmojiNode]});
        editor.update(
            () => {
                const node = $createEmojiNode('Mattermost', '');
                expect($isEmojiNode(node)).toBe(true);
                expect(node.isCustomEmoji()).toBe(true);
                expect(node.getTextContent()).toBe(':Mattermost:');
                expect(node.getEmojiName()).toBe('Mattermost');
            },
            {discrete: true},
        );
    });

    it('should export to JSON with emoji name and unicode', () => {
        const editor = createEditor({nodes: [EmojiNode]});
        editor.update(
            () => {
                const node = $createEmojiNode('Mattermost', '');
                const json = node.exportJSON();
                expect(json.type).toBe('emoji');
                expect(json.emojiName).toBe('Mattermost');
                expect(json.emojiUnicode).toBe('');
            },
            {discrete: true},
        );
    });

    it('should store and export emojiImageUrl for custom emojis', () => {
        const editor = createEditor({nodes: [EmojiNode]});
        editor.update(
            () => {
                const node = $createEmojiNode('Mattermost', '', '/api/v4/emojis/mattermost/image');
                expect(node.getEmojiImageUrl()).toBe('/api/v4/emojis/mattermost/image');
                expect(node.isCustomEmoji()).toBe(true);
                const json = node.exportJSON();
                expect(json.emojiImageUrl).toBe('/api/v4/emojis/mattermost/image');
            },
            {discrete: true},
        );
    });

    it('should import JSON with emojiImageUrl', () => {
        const editor = createEditor({nodes: [EmojiNode]});
        editor.update(
            () => {
                const node = EmojiNode.importJSON({
                    type: 'emoji',
                    version: 1,
                    emojiName: 'Mattermost',
                    emojiUnicode: '',
                    emojiImageUrl: '/api/v4/emojis/mattermost/image',
                });
                expect(node.getEmojiImageUrl()).toBe('/api/v4/emojis/mattermost/image');
                expect(node.getTextContent()).toBe(':Mattermost:');
            },
            {discrete: true},
        );
    });

    it('should not import custom emoji image urls from DOM styles', () => {
        const editor = createEditor({nodes: [EmojiNode]});
        editor.update(
            () => {
                const element = document.createElement('span');
                element.setAttribute('data-emoticon', 'Mattermost');
                element.style.backgroundImage = 'url(https://example.com/mattermost.png)';

                const conversion = EmojiNode.importDOM()?.span?.(element);
                const output = conversion?.conversion(element);
                const node = output?.node;

                expect($isEmojiNode(node)).toBe(true);
                if ($isEmojiNode(node)) {
                    expect(node.getEmojiName()).toBe('Mattermost');
                    expect(node.getEmojiImageUrl()).toBe('');
                    expect(node.getTextContent()).toBe(':Mattermost:');
                }
            },
            {discrete: true},
        );
    });
});
