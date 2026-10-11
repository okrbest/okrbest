#!/usr/bin/env bash
# Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
# See LICENSE.txt for license information.
#
# 019 레이아웃 토큰 전수 검사 (SC-004, FR-009).
# 대상 SCSS의 레이아웃 속성 px 리터럴이 허용값이 아니면 파일:줄로 보고하고
# 비0 종료한다. 허용값 = 4px 그리드(4의 배수) ∪ 비그리드 토큰 값{14,18}
# ∪ 전역 예외{1,2} ∪ 등록 예외{5,6,7,10} (specs/019-slack-layout-tokens/
# data-model.md 7절 — 새 예외는 표에 등록한 뒤 아래 EXTRA_ALLOWED에 추가).

set -u

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
SRC="$ROOT/webapp/channels/src"

TARGETS=(
    "$SRC/sass/okrbest/_overrides.scss"
    "$SRC/components/channel_header/channel_header_tabs/channel_header_tabs.scss"
    "$SRC/components/channel_header/channel_member_stack/channel_member_stack.scss"
    "$SRC/components/channel_bookmarks_rhs/channel_bookmarks_rhs.scss"
)

# 검사 속성: 간격·크기·위치·모서리. font-size/line-height(타입 체계)와
# box-shadow(효과)는 길이 토큰의 범위 밖이다.
PROPS='padding|padding-(top|right|bottom|left)|margin|margin-(top|right|bottom|left|inline-start|inline-end)|gap|row-gap|column-gap|width|height|min-width|min-height|top|right|bottom|left|border-radius'

EXTRA_ALLOWED=(1 2 5 6 7 10 14 18)

allowed() {
    local n=$1
    ((n % 4 == 0)) && return 0
    local a
    for a in "${EXTRA_ALLOWED[@]}"; do
        ((n == a)) && return 0
    done
    return 1
}

violations=0
for f in "${TARGETS[@]}"; do
    [ -f "$f" ] || continue
    while IFS= read -r hit; do
        line_no=${hit%%:*}
        line=${hit#*:}
        # 주석 줄 제외
        [[ $line =~ ^[[:space:]]*// ]] && continue
        # 선언의 px 값들 추출
        for px in $(grep -oE '\-?[0-9]+px' <<<"${line#*:}" | tr -d 'px'); do
            n=${px#-}
            if ! allowed "$n"; then
                echo "위반: ${f#"$ROOT"/}:$line_no  ${line##*( )} (${px}px)"
                violations=$((violations + 1))
            fi
        done
    done < <(grep -nE "(^|[{;])[[:space:]]*(${PROPS})[[:space:]]*:[^;]*[0-9]px" "$f")
done

if ((violations > 0)); then
    echo "— ${violations}건 위반. 기준표 토큰을 쓰거나 data-model.md 7절에 예외를 등록하라."
    exit 1
fi
echo "통과: 레이아웃 px 리터럴 전부 허용값 (그리드/토큰/등록 예외)"
