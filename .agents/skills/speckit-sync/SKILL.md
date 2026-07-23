---
name: "speckit-sync"
description: "upstream(mattermost/mattermost) 커밋을 오래된 순으로 LLM 정밀 분석하여 cherry-pick/adapt/exclude/spec으로 선별 반영하고, docs/upstream-master-unmerged-commits.md 목록을 갱신한다."
compatibility: "Requires git remote 'upstream' (mattermost/mattermost), local branch 'upstream-master', spec-kit project structure (Codex CLI)"
metadata:
  author: "okrbest"
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## 목적

okrbest는 mattermost/mattermost의 heavily-diverged 포크다. upstream 커밋을 그대로 merge할 수 없으므로, 이 스킬은 **오래된 순으로 한 커밋씩** LLM 정밀 분석을 거쳐 다음 넷 중 하나로 처리한다:

| 처리 | 조건 | 결과 |
|---|---|---|
| **cherry-pick** | 충돌 없음 + 의미 충돌 없음 | `git cherry-pick -x` 커밋 |
| **adapt** | 충돌 있으나 간단 (≤5 파일·≤150라인·보호경로 무접촉 가이드) | 프로젝트 맞춤 수정 후 새 커밋 |
| **exclude** | 우리가 자체 커밋으로 해당 기능을 변경/제거함 | ledger 부록에 사유 기록 |
| **spec** | 대규모·큰 영향 (>15 파일, >500라인, DB 마이그레이션, enterprise, 신규 대형 기능) | spec-kit 파이프라인으로 별도 개발 |

추적 원리: 반영 커밋 본문의 upstream 해시 참조(`cherry picked from commit <hash>` / `Upstream: <링크>`)와 ledger 부록(제외/spec)이 기록이며, `scripts/upstream-sync.sh update`가 이를 차감해 미반영 목록을 재생성한다. **별도 상태 파일 없음.**

도우미 스크립트: `.specify/scripts/bash/upstream-sync.sh` (이하 `$SYNC`)
`update` / `status` / `next [n]` / `signals <hash>` / `exclude <hash> <사유>` / `to-spec <hash> <specID>`

## 워크플로

### 1. 준비

1. 작업 트리 클린 확인 (`git status`). 더럽면 사용자에게 보고 후 중단.
2. `git switch master && git pull` (origin 최신화).
3. sync 브랜치 생성: `git switch -c sync/upstream-$(date +%Y%m%d)` (이미 있으면 이어서).
4. `$SYNC update` 실행 후 `$SYNC status` 요약 보고.

### 2. 커밋 루프 (사용자가 종료할 때까지 반복)

각 커밋마다:

#### 2-1. 재료 수집

- `$SYNC next` → 대상 full hash
- `$SYNC signals <hash>` → 충돌 예측(CLEAN/CONFLICT + 파일), 규모, HEAD 부재 경로, 보호 경로, 포크 자체 변경 이력
- `git show <hash>` → 실제 diff 내용

#### 2-2. LLM 정밀 분석 (필수 — 신호는 참고 자료일 뿐, 판단은 여기서)

1. **upstream 커밋의 의도** 파악: 무엇을 왜 바꾸는가 (버그픽스/기능/리팩터/문서/번역).
2. **우리 포크의 자체 변경과 대조**: signals의 FORK HISTORY에 나온 커밋들을 `git show`로 확인하고, 필요시 `git log -p master -- <경로>`와 `spec-docs/`(특히 `rebrand.md`, `feat-plan/`)를 조사한다. 질문: *우리가 이 영역을 의도적으로 바꿨거나 제거했는가?*
3. **의미 충돌 검토**: merge-tree가 CLEAN이어도 리브랜드 문자열(Mattermost→OKR.BEST), 우리가 제거한 기능 참조, 플러그인/버전 의존을 확인한다. 텍스트가 안 겹쳐도 의미가 깨질 수 있다.
4. 근거와 함께 **권고 결정**: cherry-pick / adapt / exclude / spec.

#### 2-3. 사용자 승인 (커밋마다, 반드시 선택지를 제시하고 사용자 응답을 기다린다)

분석 요약 + 권고 + 근거를 제시하고 선택지를 준다:
① 권고대로 진행 ② exclude ③ spec 전환 ④ 건너뜀(목록에 남김, 다음에 재검토) ⑤ 세션 종료

**승인 없이 어떤 코드 변경도 하지 않는다.**

#### 2-4. 실행

- **cherry-pick**:
  ```bash
  git cherry-pick -x <hash>
  git commit --amend -m "$(git log -1 --pretty=%B)

  Upstream: https://github.com/mattermost/mattermost/commit/<full-hash>"
  ```
  cherry-pick 실패 시 `git cherry-pick --abort` 후 adapt로 전환 제안.
- **adapt**: superpowers 규율 적용 — 동작 변경이면 테스트 동반(test-driven-development), 원인 조사는 systematic-debugging, 완료 선언 전 검증 증거(verification-before-completion). 커밋 형식:
  ```
  <원본 커밋 제목 유지>

  <okrbest 맞춤 수정 요지 1-3줄>

  (cherry picked from commit <full-hash>, adapted for okrbest)
  Upstream: https://github.com/mattermost/mattermost/commit/<full-hash>
  ```
- **exclude**: `$SYNC exclude <hash> "<사유>"` — 사유는 우리 쪽 근거 커밋/문서를 포함해 구체적으로.
- **spec**: `$SYNC to-spec <hash> "<가칭 또는 specs/NNN-이름>"` 기록. 그 후 사용자에게 `$speckit-specify` 착수 여부를 **명시적으로 질문**한다 (AGENTS.md 핸드오프 규칙 — 자동 진입 금지). spec 구현 완료 커밋 본문에 `Upstream: <링크>`를 넣어야 목록에서 자동 차감됨을 안내.
- **건너뜀**: 아무것도 하지 않음 (목록 유지).

#### 2-5. 목록 갱신

`$SYNC update` 재실행 → 남은 개수·마지막 반영 커밋 갱신 확인.

### 3. 세션 마감

1. **품질 게이트** (constitution 원칙 I — 변경된 패키지만):
   - `server/` 변경 시: `cd server && make check-style` (+ 영향 패키지 `go test`)
   - `webapp/` 변경 시: `cd webapp && npm run check && npm run check-types` (+ 관련 `npm run test`)
   - 통과 증거를 보인 후에만 완료 선언 (verification-before-completion).
2. ledger 커밋: `docs: upstream sync 진행 (picked N, adapted M, excluded K)`
3. **선형 병합** (사용자 확인 후):
   ```bash
   git switch master
   git merge --ff-only sync/upstream-YYYYMMDD
   git branch -d sync/upstream-YYYYMMDD
   ```
   ff 불가 시(작업 중 master 전진): sync 브랜치를 `git rebase master` 후 재시도.
4. 요약 보고: 처리 커밋 수(분기별), 남은 pending, 다음 대상.

## 주의

- 절대 master에서 직접 작업하지 않는다 (sync 브랜치에서만).
- 오래된 순서를 건너뛰어 최신 커밋을 먼저 반영하지 않는다 (의존성 붕괴). "건너뜀"은 예외적·일시적이어야 한다.
- 대량 자동 처리 금지 — 커밋마다 분석·승인. 시간이 걸려도 정밀 분석이 우선.
- Translations update(Weblate) 커밋은 우리 i18n 변경(ko.json)과 상시 충돌 — adapt 시 우리 ko.json 문자열을 보존한다 (constitution 원칙 V).
- 라이선스·리브랜드 충실성 (constitution 원칙 IV): copyright 헤더·NOTICE.txt 관련 upstream 변경은 그대로 반영, 우리 리브랜드 문자열은 보존.
