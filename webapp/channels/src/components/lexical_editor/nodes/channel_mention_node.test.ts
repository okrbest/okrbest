// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {$createChannelMentionNode, $isChannelMentionNode, ChannelMentionNode} from './channel_mention_node';
import {createEditor} from 'lexical';

describe('ChannelMentionNode', () => {
    it('should use channel slug for text content and display name for decoration', () => {
        const editor = createEditor({nodes: [ChannelMentionNode]});
        editor.update(
            () => {
                const node = $createChannelMentionNode('1ae7f9f366a800921454a63cb5268e14', '테스트');
                expect($isChannelMentionNode(node)).toBe(true);
                expect(node.getTextContent()).toBe('~1ae7f9f366a800921454a63cb5268e14');
                expect(node.getChannelName()).toBe('1ae7f9f366a800921454a63cb5268e14');
                expect(node.getDisplayName()).toBe('테스트');
            },
            {discrete: true},
        );
    });

    it('should export to JSON with slug and display name', () => {
        const editor = createEditor({nodes: [ChannelMentionNode]});
        editor.update(
            () => {
                const node = $createChannelMentionNode('off-topic', '잡담');
                const json = node.exportJSON();
                expect(json.type).toBe('channel-mention');
                expect(json.channelName).toBe('off-topic');
                expect(json.displayName).toBe('잡담');
            },
            {discrete: true},
        );
    });
});
