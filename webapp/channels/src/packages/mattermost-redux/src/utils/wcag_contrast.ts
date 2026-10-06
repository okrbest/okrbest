// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

// WCAG 2.x relative luminance and contrast ratio, used by theme contrast
// regression tests (spec 014). Formulas: https://www.w3.org/TR/WCAG21/#dfn-relative-luminance

function channelToLinear(channel8bit: number): number {
    const c = channel8bit / 255;
    if (c <= 0.03928) {
        return c / 12.92;
    }
    return Math.pow((c + 0.055) / 1.055, 2.4);
}

export function relativeLuminance(hex: string): number {
    const normalized = hex.replace('#', '');
    const r = parseInt(normalized.substring(0, 2), 16);
    const g = parseInt(normalized.substring(2, 4), 16);
    const b = parseInt(normalized.substring(4, 6), 16);
    return (0.2126 * channelToLinear(r)) + (0.7152 * channelToLinear(g)) + (0.0722 * channelToLinear(b));
}

export function contrastRatio(hexA: string, hexB: string): number {
    const la = relativeLuminance(hexA);
    const lb = relativeLuminance(hexB);
    const lighter = Math.max(la, lb);
    const darker = Math.min(la, lb);
    return (lighter + 0.05) / (darker + 0.05);
}
