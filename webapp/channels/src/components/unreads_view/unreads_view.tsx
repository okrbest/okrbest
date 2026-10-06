// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useEffect} from 'react';
import {FormattedMessage, useIntl} from 'react-intl';
import {useDispatch} from 'react-redux';

import {selectLhsItem} from 'actions/views/lhs';
import {suppressRHS, unsuppressRHS} from 'actions/views/rhs';

import ChatIllustration from 'components/common/svg_images_components/chat_illustration_svg';
import NoResultsIndicator from 'components/no_results_indicator';
import Header from 'components/widgets/header';

import {LhsItemType, LhsPage} from 'types/store/lhs';

import './unreads_view.scss';

const UnreadsView = () => {
    const {formatMessage} = useIntl();
    const dispatch = useDispatch();

    useEffect(() => {
        dispatch(selectLhsItem(LhsItemType.Page, LhsPage.Unreads));
        dispatch(suppressRHS);

        return () => {
            dispatch(unsuppressRHS);
        };
    }, []);

    return (
        <div
            id='app-content'
            className='UnreadsView app__content'
        >
            <Header
                level={2}
                className='UnreadsView__header'
                data-testid='unreads-header'
                heading={
                    <FormattedMessage
                        id='unreads.heading'
                        defaultMessage='Unreads'
                    />
                }
                subtitle={
                    <FormattedMessage
                        id='unreads.subtitle'
                        defaultMessage='Unread messages from all your channels show here'
                    />
                }
            />
            <div className='UnreadsView__body'>
                <NoResultsIndicator
                    expanded={true}
                    iconGraphic={ChatIllustration}
                    title={formatMessage({
                        id: 'unreads.emptyState.title',
                        defaultMessage: 'You’re all caught up',
                    })}
                    subtitle={formatMessage({
                        id: 'unreads.emptyState.subtitle',
                        defaultMessage: 'New unread messages will show here.',
                    })}
                />
            </div>
        </div>
    );
};

export default UnreadsView;
