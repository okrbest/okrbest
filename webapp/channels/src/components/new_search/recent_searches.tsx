// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {format} from 'date-fns';
import React, {useCallback, useEffect, useState} from 'react';
import {FormattedMessage} from 'react-intl';
import styled from 'styled-components';

import type {RecentSearch} from 'utils/recent_searches';
import {getRecentSearches, removeRecentSearch} from 'utils/recent_searches';

const RecentSearchesContainer = styled.div`
    padding: 12px 20px;
    border-top: 1px solid rgba(var(--center-channel-color-rgb), 0.08);
`;

const RecentSearchesHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
`;

const RecentSearchesTitle = styled.div`
    font-size: 12px;
    font-weight: 600;
    color: rgba(var(--center-channel-color-rgb), 0.64);
`;

const RecentSearchItem = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    border-radius: 4px;
    cursor: pointer;
    margin-bottom: 4px;

    &:hover {
        background: rgba(var(--center-channel-color-rgb), 0.08);

        .delete-button {
            opacity: 1;
        }
    }

    &:last-child {
        margin-bottom: 0;
    }
`;

const RecentSearchContent = styled.div`
    display: flex;
    flex-direction: column;
    gap: 2px;
    flex: 1;
    min-width: 0;
`;

const RecentSearchTerm = styled.div`
    font-size: 14px;
    font-weight: 500;
    color: var(--center-channel-color);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
`;

const RecentSearchDate = styled.div`
    font-size: 12px;
    color: rgba(var(--center-channel-color-rgb), 0.56);
`;

const DeleteButton = styled.button`
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border: none;
    background: none;
    color: rgba(var(--center-channel-color-rgb), 0.56);
    cursor: pointer;
    border-radius: 4px;
    opacity: 0;
    transition: opacity 0.2s;

    &:hover {
        background: rgba(var(--center-channel-color-rgb), 0.08);
        color: rgba(var(--center-channel-color-rgb), 0.72);
    }

    i {
        font-size: 16px;
    }
`;

type Props = {
    searchTerms: string;
    searchType: string;
    onSearchClick: (term: string) => void;
};

const RecentSearches = ({searchTerms, searchType, onSearchClick}: Props): JSX.Element | null => {
    const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);

    useEffect(() => {
        const searches = getRecentSearches();
        // 현재 searchType과 일치하는 검색어만 필터링
        const filtered = searches.filter((search) => {
            // searchType이 비어있거나 'messages'일 때는 'messages' 타입만 표시
            if (searchType === '' || searchType === 'messages') {
                return search.searchType === 'messages' || search.searchType === '';
            }
            return search.searchType === searchType;
        });
        setRecentSearches(filtered);
    }, [searchType]);

    const handleSearchClick = useCallback((term: string) => {
        onSearchClick(term);
    }, [onSearchClick]);

    const handleDelete = useCallback((e: React.MouseEvent, term: string, type: string) => {
        e.stopPropagation();
        removeRecentSearch(term, type);

        // 상태 업데이트
        const searches = getRecentSearches();
        const filtered = searches.filter((search) => {
            if (searchType === '' || searchType === 'messages') {
                return search.searchType === 'messages' || search.searchType === '';
            }
            return search.searchType === searchType;
        });
        setRecentSearches(filtered);
    }, [searchType]);

    // 검색어가 입력되었거나 최근 검색어가 없으면 표시하지 않음
    if (searchTerms.trim() !== '' || recentSearches.length === 0) {
        return null;
    }

    return (
        <RecentSearchesContainer>
            <RecentSearchesHeader>
                <RecentSearchesTitle>
                    <FormattedMessage
                        id='search_bar.recent_searches'
                        defaultMessage='최근 검색어'
                    />
                </RecentSearchesTitle>
            </RecentSearchesHeader>
            {recentSearches.map((search) => (
                <RecentSearchItem
                    key={`${search.term}_${search.timestamp}`}
                    onClick={() => handleSearchClick(search.term)}
                >
                    <RecentSearchContent>
                        <RecentSearchTerm>{search.term}</RecentSearchTerm>
                        <RecentSearchDate>
                            {format(new Date(search.timestamp), 'yyyy.MM.dd')}
                        </RecentSearchDate>
                    </RecentSearchContent>
                    <DeleteButton
                        className='delete-button'
                        onClick={(e) => handleDelete(e, search.term, search.searchType)}
                        aria-label='Delete recent search'
                    >
                        <i className='icon icon-close'/>
                    </DeleteButton>
                </RecentSearchItem>
            ))}
        </RecentSearchesContainer>
    );
};

export default RecentSearches;
