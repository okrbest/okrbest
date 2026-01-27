// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {openModal} from 'actions/views/modals';

import BoardsModal from 'components/boards_modal';

import {ModalIdentifiers} from 'utils/constants';

import type {DispatchFunc} from 'types/store';

export function openBoardInModal(boardUrl: string, dispatch: DispatchFunc) {
    dispatch(openModal({
        modalId: ModalIdentifiers.BOARDS_MODAL,
        dialogType: BoardsModal,
        dialogProps: {
            boardUrl,
        },
    }));
}
