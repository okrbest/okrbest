// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {flip, offset, shift} from '@floating-ui/react';
import classNames from 'classnames';
import React, {useCallback, useState} from 'react';
import {useIntl} from 'react-intl';
import {useSelector} from 'react-redux';
import {$getSelection, $isRangeSelection, $createTextNode} from 'lexical';

import {EmoticonHappyOutlineIcon} from '@mattermost/compass-icons/components';
import type {Emoji, SystemEmoji} from '@mattermost/types/emojis';

import {getConfig} from 'mattermost-redux/selectors/entities/general';
import {getEmojiImageUrl, getEmojiName, isSystemEmoji} from 'mattermost-redux/utils/emoji_utils';

import useEmojiPicker, {useEmojiPickerOffset} from 'components/emoji_picker/use_emoji_picker';
import KeyboardShortcutSequence, {KEYBOARD_SHORTCUTS} from 'components/keyboard_shortcuts/keyboard_shortcuts_sequence';
import type {LexicalTextEditorHandle} from 'components/lexical_editor/lexical_text_editor';
import {$createEmojiNode} from 'components/lexical_editor/nodes/emoji_node';
import WithTooltip from 'components/with_tooltip';

import {unifiedToUnicode} from 'utils/emoji_utils';
import {focusAndInsertText} from 'utils/exec_commands';
import {horizontallyWithin} from 'utils/floating';

import type {GlobalState} from 'types/store';

import {IconContainer} from './formatting_bar/formatting_icon';

const useEditorEmojiPicker = (
    textboxId: string,
    isDisabled: boolean,
    shouldShowPreview: boolean,
    editorRef?: React.RefObject<LexicalTextEditorHandle>,
) => {
    const intl = useIntl();

    const enableEmojiPicker = useSelector((state: GlobalState) => getConfig(state).EnableEmojiPicker === 'true');
    const enableGifPicker = useSelector((state: GlobalState) => getConfig(state).EnableGifPicker === 'true');

    const [showEmojiPicker, setShowEmojiPicker] = useState(false);

    const toggleEmojiPicker = useCallback((e?: React.MouseEvent<HTMLButtonElement, MouseEvent>): void => {
        e?.stopPropagation();
        setShowEmojiPicker((prev) => !prev);
    }, []);

    const insertTextAtCaret = useCallback((text: string) => {
        const textbox = document.getElementById(textboxId);
        if (!textbox) {
            return;
        }
        focusAndInsertText(textbox, text);
    }, [textboxId]);

    const handleEmojiClick = useCallback((emoji: Emoji) => {
        const emojiAlias = getEmojiName(emoji);

        if (!emojiAlias) {
            return;
        }

        const editor = editorRef?.current?.getEditor();
        if (editor) {
            let emojiUnicode = '';
            let emojiImageUrl = '';
            if (isSystemEmoji(emoji)) {
                emojiUnicode = unifiedToUnicode((emoji as SystemEmoji).unified);
            } else {
                emojiImageUrl = getEmojiImageUrl(emoji);
            }

            editor.update(() => {
                const selection = $getSelection();
                if ($isRangeSelection(selection)) {
                    const emojiNode = $createEmojiNode(emojiAlias, emojiUnicode, emojiImageUrl);
                    selection.insertNodes([emojiNode]);
                    const spaceNode = $createTextNode(' ');
                    emojiNode.insertAfter(spaceNode);
                    spaceNode.select();
                }
            });
        } else if (isSystemEmoji(emoji)) {
            insertTextAtCaret(unifiedToUnicode((emoji as SystemEmoji).unified));
        } else {
            insertTextAtCaret(`:${emojiAlias}:`);
        }

        setShowEmojiPicker(false);
    }, [insertTextAtCaret, editorRef]);

    const handleGifClick = useCallback((gif: string) => {
        insertTextAtCaret(gif);

        setShowEmojiPicker(false);
    }, [insertTextAtCaret]);

    const {
        emojiPicker,
        getReferenceProps,
        setReference,
    } = useEmojiPicker({
        showEmojiPicker,
        setShowEmojiPicker,

        enableGifPicker,
        onGifClick: handleGifClick,
        onEmojiClick: handleEmojiClick,

        overrideMiddleware: [
            offset(useEmojiPickerOffset),
            shift(),
            horizontallyWithin({
                boundary: document.getElementById(textboxId),
            }),
            flip({
                fallbackAxisSideDirection: 'end',
            }),
        ],
    });

    let emojiPickerControls = null;
    if (enableEmojiPicker && !isDisabled) {
        emojiPickerControls = (
            <>
                <WithTooltip
                    title={
                        <KeyboardShortcutSequence
                            shortcut={KEYBOARD_SHORTCUTS.msgShowEmojiPicker}
                            hoistDescription={true}
                            isInsideTooltip={true}
                        />
                    }
                >
                    <IconContainer
                        id={'emojiPickerButton'}
                        ref={setReference}
                        onClick={toggleEmojiPicker}
                        type='button'
                        aria-label={intl.formatMessage({id: 'emoji_picker.emojiPicker.button.ariaLabel', defaultMessage: 'select an emoji'})}
                        disabled={shouldShowPreview}
                        className={classNames({active: showEmojiPicker})}
                        {...getReferenceProps()}
                    >
                        <EmoticonHappyOutlineIcon
                            color={'currentColor'}
                            size={18}
                        />
                    </IconContainer>
                </WithTooltip>
                {emojiPicker}
            </>
        );
    }

    return {emojiPicker: emojiPickerControls, enableEmojiPicker, toggleEmojiPicker};
};

export default useEditorEmojiPicker;
