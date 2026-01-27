// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useCallback, useEffect, useRef} from 'react';
import {Modal} from 'react-bootstrap';
import {useIntl} from 'react-intl';

import './boards_modal.scss';

type Props = {
    boardUrl: string;
    onExited: () => void;
};

const BoardsModal = ({boardUrl, onExited}: Props) => {
    const {formatMessage} = useIntl();
    const iframeRef = useRef<HTMLIFrameElement>(null);

    const handleClose = useCallback(() => {
        onExited();
    }, [onExited]);

    // iframe 내 닫기 버튼 클릭 감지
    useEffect(() => {
        let cleanupClickHandler: (() => void) | null = null;

        const handleIframeLoad = () => {
            try {
                const iframeDoc = iframeRef.current?.contentDocument || iframeRef.current?.contentWindow?.document;
                if (!iframeDoc) {
                    return;
                }

                const handleClick = (e: MouseEvent) => {
                    const target = e.target as HTMLElement;
                    const closeButton = target.closest('.IconButton.dialog__close');
                    if (closeButton) {
                        e.preventDefault();
                        e.stopPropagation();
                        handleClose();
                    }
                };

                iframeDoc.addEventListener('click', handleClick, true);
                cleanupClickHandler = () => {
                    iframeDoc.removeEventListener('click', handleClick, true);
                };
            } catch (err) {
                // Cross-origin 접근 불가 시 무시
                console.warn('Cannot access iframe content:', err);
            }
        };

        const iframe = iframeRef.current;
        if (iframe) {
            iframe.addEventListener('load', handleIframeLoad);
        }

        return () => {
            if (iframe) {
                iframe.removeEventListener('load', handleIframeLoad);
            }
            if (cleanupClickHandler) {
                cleanupClickHandler();
            }
        };
    }, [handleClose]);

    return (
        <Modal
            dialogClassName='boards-modal'
            show={true}
            onHide={handleClose}
            onExited={onExited}
            backdrop='static'
            role='dialog'
            aria-labelledby='boardsModalLabel'
        >
            <Modal.Body>
                <iframe
                    ref={iframeRef}
                    src={boardUrl}
                    title={formatMessage({id: 'boards_modal.iframe_title', defaultMessage: 'Boards Content'})}
                    className='boards-modal__iframe'
                    sandbox='allow-same-origin allow-scripts allow-forms allow-popups'
                />
            </Modal.Body>
        </Modal>
    );
};

export default BoardsModal;
