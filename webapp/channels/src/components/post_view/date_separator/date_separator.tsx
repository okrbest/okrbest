// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {memo} from 'react';
import type {FC} from 'react';

import Timestamp, {RelativeRanges} from 'components/timestamp';
import BasicSeparator from 'components/widgets/separator/basic-separator';

const DATE_RANGES = [
    RelativeRanges.TODAY_TITLE_CASE,
    RelativeRanges.YESTERDAY_TITLE_CASE,
];

// Slack 날짜 구분 벤치마크 (spec 019 measurements 16절) — 요일을 병기한다.
// 당해 연도는 연도를 생략한다 ("10월 8일 목요일" / "Friday, January 12, 2018").
const useDate = ({value}: {value: Date}) => {
    const sameYear = value.getFullYear() === new Date().getFullYear();
    if (sameYear) {
        return {weekday: 'long', month: 'long', day: 'numeric'} as const;
    }
    return {weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'} as const;
};

type Props = {
    date: number | Date;
};

const DateSeparator: FC<Props> = ({date}) => {
    return (
        <BasicSeparator>
            <Timestamp
                value={date}
                useTime={false}
                useDate={useDate}
                useSemanticOutput={false}
                ranges={DATE_RANGES}
            />
        </BasicSeparator>
    );
};

export default memo(DateSeparator);
