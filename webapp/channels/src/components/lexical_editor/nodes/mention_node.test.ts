// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {$getRoot, $createParagraphNode, createEditor} from 'lexical';

import {$createMentionNode, $isMentionNode, MentionNode} from './mention_node';

describe('MentionNode', () => {
    it('should create a mention node with username', () => {
        const editor = createEditor({nodes: [MentionNode]});
        editor.update(
            () => {
                const node = $createMentionNode('johndoe', 'John Doe');
                expect($isMentionNode(node)).toBe(true);
                expect(node.getTextContent()).toBe('@John Doe');
                expect(node.getUsername()).toBe('johndoe');
            },
            {discrete: true},
        );
    });

    it('should export to JSON correctly', () => {
        const editor = createEditor({nodes: [MentionNode]});
        editor.update(
            () => {
                const node = $createMentionNode('johndoe', 'John Doe');
                const json = node.exportJSON();
                expect(json.type).toBe('mention');
                expect(json.username).toBe('johndoe');
            },
            {discrete: true},
        );
    });
});
