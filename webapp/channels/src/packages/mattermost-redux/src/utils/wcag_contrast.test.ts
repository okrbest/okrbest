// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {relativeLuminance, contrastRatio} from 'mattermost-redux/utils/wcag_contrast';

describe('wcag_contrast', () => {
    describe('relativeLuminance', () => {
        it('white is 1', () => {
            expect(relativeLuminance('#ffffff')).toBeCloseTo(1, 5);
        });

        it('black is 0', () => {
            expect(relativeLuminance('#000000')).toBeCloseTo(0, 5);
        });

        it('is monotonic across the slate chrome layers', () => {
            // team bar < sidebar < center channel (명도 3단)
            const teamBar = relativeLuminance('#eaeaea');
            const sidebar = relativeLuminance('#fdfdfd');
            const center = relativeLuminance('#ffffff');
            expect(teamBar).toBeLessThan(sidebar);
            expect(sidebar).toBeLessThan(center);
        });
    });

    describe('contrastRatio', () => {
        it('identical colors give 1', () => {
            expect(contrastRatio('#ffffff', '#ffffff')).toBeCloseTo(1, 5);
        });

        it('black on white gives 21', () => {
            expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 2);
        });

        it('is symmetric', () => {
            expect(contrastRatio('#1d1c1d', '#eaeaea')).toBeCloseTo(contrastRatio('#eaeaea', '#1d1c1d'), 5);
        });

        it('matches the measured Slack tab rail pair (#1D1C1D on #EAEAEA = 14.12)', () => {
            // slack-design/design.md 접근성 감사 표의 실측값
            expect(contrastRatio('#1d1c1d', '#eaeaea')).toBeCloseTo(14.12, 1);
        });

        it('matches the measured OKR.Best error text pair (#D24B4E on #FFFFFF = 4.32)', () => {
            // okrbest-design/design.md 프리셋 대비 표의 실측값
            expect(contrastRatio('#d24b4e', '#ffffff')).toBeCloseTo(4.32, 1);
        });
    });
});
