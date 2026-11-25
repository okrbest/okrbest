#!/usr/bin/env bash

# okrbest preset 재설치
#
# .specify/okrbest-preset/(원본)을 설치하고 세 에이전트 surface의 생성 스킬과
# manifest를 preset 판으로 맞춘다. preset 원본을 고친 뒤나 spec-kit 업그레이드 뒤에 돌린다.
#
# preset은 활성 통합 하나에만 배달되고, `integration use`만으로는 manifest 해시가
# 갱신되지 않는 경우가 있다(2026-11 spec-kit 1.4.5에서 확인). 그래서 통합마다
# use → upgrade --force를 차례로 돌린다. 활성 통합을 upgrade하면 preset이 다시 등록된다.
#
# Usage: ./reinstall-okrbest-preset.sh
# 종료 코드: 0 = status OK, 1 = 실패

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
cd "$REPO_ROOT"

PRESET_ID="okrbest"
PRESET_SRC=".specify/okrbest-preset"
INTEGRATIONS=(claude codex cursor-agent)

command -v specify >/dev/null 2>&1 || { echo "specify CLI가 없다" >&2; exit 1; }
[ -d "$PRESET_SRC" ] || { echo "$PRESET_SRC 없음" >&2; exit 1; }

default_before="$(python3 -c 'import json; print(json.load(open(".specify/integration.json")).get("default_integration", ""))')"

# 출력을 먼저 받아 둔다. `specify … | grep -q`는 grep이 먼저 끝나 SIGPIPE가 나고,
# pipefail 아래에서 조건이 거짓이 된다.
preset_list="$(specify preset list 2>/dev/null || true)"
if grep -qF "($PRESET_ID)" <<<"$preset_list"; then
    echo "== preset 제거: $PRESET_ID"
    specify preset remove "$PRESET_ID"
fi
echo "== preset 설치: $PRESET_SRC"
specify preset add --dev "$PRESET_SRC"

for k in "${INTEGRATIONS[@]}"; do
    echo "== $k: use → upgrade --force"
    specify integration use "$k"
    specify integration upgrade "$k" --force
done

# 원래 기본 통합으로 되돌린다. 마지막에 돈 통합과 다르면 그 통합도 upgrade로 맞춘다.
if [ -n "$default_before" ] && [ "$default_before" != "${INTEGRATIONS[-1]}" ]; then
    echo "== 기본 통합 복원: $default_before"
    specify integration use "$default_before"
    specify integration upgrade "$default_before" --force
fi

echo "== 확인"
specify integration status --json | python3 -c '
import json, sys
d = json.load(sys.stdin)
mod, miss, st = d.get("modified_managed_files"), d.get("missing_managed_files"), d.get("status")
print("integration status: %s (수정 %s건, 누락 %s건)" % (st, mod, miss))
sys.exit(0 if mod == 0 and miss == 0 else 1)'
