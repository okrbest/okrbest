// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

// okrbest: upstream은 editors/shared의 referencesResourceAttributes를 쓰지만, 그 함수는 제외한
// 채널 속성 계보(c3a5a087 #37755)에 있다. 같은 동작을 여기 둔다.
const RESOURCE_ATTRIBUTES_PREFIX = 'resource.attributes.';

function referencesResourceAttributes(expression: string): boolean {
    // Strip quoted string literals so a value like "resource.attributes.x" is not
    // mistaken for an actual attribute reference.
    const withoutLiterals = expression.replace(/'[^']*'|"[^"]*"/g, '');
    return withoutLiterals.includes(RESOURCE_ATTRIBUTES_PREFIX);
}

// Early feedback only: /cel/check accepts these, and the team policy save is what rejects them.
// It also keeps a doomed rule from reaching the parent link writes, which run before the save.
export function teamRuleGuardErrorId(expression: string): 'resource_attributes' | undefined {
    if (referencesResourceAttributes(expression)) {
        return 'resource_attributes';
    }
    return undefined;
}
