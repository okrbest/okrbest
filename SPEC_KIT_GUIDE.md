# Spec Kit + Superpowers 개발 가이드

**대상 독자:** 이 저장소를 clone해서 기능 개발에 참여하는 팀원.
이 워크플로를 **다른 프로젝트에 이식**하려면 → [WORKFLOW_PORTING_GUIDE.md](WORKFLOW_PORTING_GUIDE.md)

> 예시는 Claude Code(`/speckit-*`) 기준입니다. **Codex CLI**는 접두사만 `$`로
> 바꾸면 전부 동일합니다 (`$speckit-specify …`). **Cursor IDE Agent**는
> `.cursor/skills/`의 동일 스킬을 사용합니다 — 채팅에서 "speckit-specify로
> 명세 작성해줘"처럼 스킬 이름을 언급하면 됩니다.

---

## 1. 두 도구를 왜 함께 쓰나

- **[Spec Kit](https://github.com/github/spec-kit)** — *무엇을·왜* 만들지 정하는 **명세 파이프라인**. 바로 코딩하지 않고 `명세 → 계획 → 작업 → 구현` 순서로 진행. 산출물 `specs/<NNN>/`이 공식 기준 문서(source of truth).
- **[Superpowers](https://github.com/obra/superpowers)** — *어떻게* 만들지 통제하는 **구현 규율**(TDD·검증·디버깅·리뷰). 코드를 짜는 순간 자동으로 작동.

> **핵심 개념:** Spec Kit이 **설계도**를 그리고, Superpowers가 **시공 규칙**을 강제합니다. 둘은 겹치지 않고 보완합니다.

| | **Spec Kit** | **Superpowers** |
|---|---|---|
| 담당 | 무엇을·왜 (명세/계획) | 어떻게 (구현 규율) |
| 형태 | 저장소에 커밋된 스킬 (clone하면 있음) | 사용자 전역 플러그인 (각자 설치) |
| 호출 | 수동 `/speckit-*` | 자동 (SessionStart 훅) |

---

## 2. 시작하기 — clone 후 각자 1회씩 두 가지 설치

**Spec Kit 기본 구성 파일(스캐폴딩)은 이미 저장소에 커밋되어 있습니다** (`.specify/`,
`.claude/skills/`, `.agents/skills/`, `.cursor/skills/`, `CLAUDE.md`,
`AGENTS.md`, `.cursor/rules/`) — 프로젝트 쪽 준비는 끝난 상태. 각자 개인
환경에 아래 **두 가지만 1회씩** 설치하면 됩니다.

> **Cursor IDE Agent만 쓰는 경우**: 추가 설치 없음. Superpowers 플러그인은
> Claude Code·Codex 전용이며, Cursor에서는 같은 구현 규율(TDD·검증·근본 원인
> 디버깅)이 `.cursor/rules/okrbest-workflow.mdc`로 적용됩니다.

### 2-1. `specify` CLI (Spec Kit) — 각자 1회

터미널에서 실행합니다. 준비물: [uv](https://docs.astral.sh/uv/), Python 3.11+.

```bash
uv tool install specify-cli --from git+https://github.com/github/spec-kit.git
specify version   # 설치 확인
```

버전 확인·업그레이드 용도의 전역 CLI입니다. `/speckit-*` 스킬 자체는 저장소에
커밋된 스크립트로 동작하므로, CLI가 없어도 일상 명령은 대부분 돌아갑니다.
스캐폴딩 버전 변경(업그레이드·재init)은 관리자가 관리합니다 — 개인이 임의로
`specify init --force`를 실행하지 마세요.

### 2-2. Superpowers 플러그인 — 각자 1회

에이전트 안에서 입력하는 대화형 명령입니다.

| 환경 | 설치 명령 |
|---|---|
| Claude Code | `/plugin install superpowers@claude-plugins-official` |
| Codex CLI | `/plugins` → `superpowers` 검색 → Install |

설치 후 **새 세션을 시작하거나 `/clear`** 하세요 (SessionStart 훅 적용 조건).

**확인:** 새 세션에서 `brainstorming`, `test-driven-development` 스킬이 보이면 준비 끝.

---

## 3. 기능 개발 흐름 (따라하기)

전체 흐름 한 줄:

```
아이디어 → (0.brainstorming) → 1.specify → 2.clarify → 3.plan → 4.tasks → 5.analyze → 6.implement
              복잡할 때만                    권장                              권장      ← 여기서 Superpowers 작동
```

**시작 분기 — 아이디어가 얼마나 명확한가?**

- **단순·명확** (설정 변경, 버그픽스, 요구사항이 뻔한 기능) → 0단계 건너뛰고 바로 `1. specify`
- **복잡·막연** (요구사항·설계를 먼저 정리해야 하는 기능) → `0. brainstorming`부터

### 0. (복잡할 때만) 아이디어 다듬기 — brainstorming

```
이 기능 brainstorming부터 하자: <아이디어>
```

에이전트가 한 번에 하나씩 질문하며 의도·요구사항·설계를 정리합니다.
설계가 정리되면 에이전트가 다음 선택지를 제시합니다 — **여러분이 고르면 됩니다**:

> ① `/speckit-specify`로 진행 ② 더 다듬기 ③ 중단/보류

①을 고르면 정리된 설계가 명세로 넘어갑니다. (에이전트가 선택지 없이 멋대로
다음 단계로 가면 → 8절 문제 해결 참고)

### 1. 명세 작성 — specify

```
/speckit-specify <기능 설명 또는 승인된 설계>
```

→ 기능 브랜치 + `specs/<NNN>-<이름>/spec.md` 생성. User Story(P1/P2/P3),
요구사항(FR-001…), 성공 기준(SC-001…), 품질 체크리스트가 채워집니다.

### 2. (권장) 모호함 해소 — clarify

```
/speckit-clarify
```

→ spec.md의 모호한 부분을 최대 5개 질문으로 정리해 반영. spec에
`[NEEDS CLARIFICATION]`이 남아 있으면 반드시 실행하세요.

### 3. 기술 계획 — plan

```
/speckit-plan server는 Go 1.24 + Makefile, webapp은 React + TypeScript + npm workspaces 스택에 맞춰 작성
```

→ `plan.md`와 설계 문서 생성. [Constitution](.specify/memory/constitution.md) 제약이 자동 반영됩니다.

### 4. 작업 분해 — tasks

```
/speckit-tasks
```

→ 의존성 순서로 정렬된 실행 가능한 `tasks.md` 생성.

### 5. (권장) 일관성 점검 — analyze

```
/speckit-analyze
```

→ spec·plan·tasks 간 불일치를 구현 전에 잡아냅니다.

### 6. 구현 — implement

```
/speckit-implement
```

→ `tasks.md`를 순서대로 구현. **이때부터 Superpowers 규율이 자동 작동합니다** (4절).

---

## 4. 구현 중 자동으로 지켜지는 규율

`/speckit-implement` 동안 별도 호출 없이 아래 규율이 적용됩니다. 모두
[Constitution](.specify/memory/constitution.md)의 규칙을 구현 중에 실제로 강제하는 장치입니다.

| Superpowers 스킬 | 하는 일 |
|---|---|
| `test-driven-development` | 실패하는 테스트를 **먼저** 작성 |
| `verification-before-completion` | 검증 명령 **증거**를 보인 후에만 "완료" 선언 |
| `systematic-debugging` | 땜질 수정 전에 **근본 원인** 조사 |
| `using-git-worktrees` | 작업당 격리 브랜치/워크스페이스 |
| `requesting`/`receiving-code-review` | 머지 전 리뷰, 리뷰 의견 맹목 수용 금지 |

에이전트가 이 규율을 건너뛰는 것처럼 보이면 그냥 지적하세요
("테스트 먼저 작성해줘", "검증 증거 보여줘").

---

## 5. 명령 치트시트

| 명령 | 용도 | 언제 |
|---|---|---|
| `/speckit-specify <설명>` | 명세 생성 | 기능 시작 (필수) |
| `/speckit-clarify` | 모호함 해소 | specify 직후 (권장) |
| `/speckit-plan <스택 힌트>` | 기술 계획 | 필수 |
| `/speckit-tasks` | 작업 분해 | 필수 |
| `/speckit-analyze` | 문서 일관성 점검 | implement 전 (권장) |
| `/speckit-implement` | 구현 실행 | 필수 |
| `/speckit-checklist` | 품질 체크리스트 생성 | 필요 시 |
| `/speckit-constitution` | 프로젝트 원칙 편집 | 원칙 변경 시에만 |
| `/speckit-sync` | upstream 커밋 선별 반영 (okrbest 전용 — 상세: 6절) | upstream 동기화 세션 |

명령 뒤에 자연어를 붙이면 그대로 입력으로 전달됩니다. Codex는 `/` 대신 `$`.

---

## 6. upstream 동기화 — `/speckit-sync`

okrbest는 mattermost/mattermost의 **heavily-diverged 포크**라 원본 커밋을
그대로 merge/cherry-pick할 수 없습니다. `/speckit-sync`는 upstream 개선을
"우리 프로젝트의 개선·신규 기능" 개념으로 **오래된 순서대로 한 커밋씩 선별
반영**하고, 어디까지 반영했는지 추적하는 okrbest 전용 스킬입니다.

세 에이전트 모두 지원: Claude Code `/speckit-sync`, Codex `$speckit-sync`,
Cursor는 채팅에서 "speckit-sync 스킬로 upstream 동기화하자" 등으로 호출
(스킬 정의: `.claude/skills/` · `.agents/skills/` · `.cursor/skills/`).

### 6-1. 준비 조건

- git remote `upstream` = `https://github.com/mattermost/mattermost.git`
- 로컬 브랜치 `upstream-master` (upstream/master 추적)
- 미반영 목록(ledger): [docs/upstream-master-unmerged-commits.md](docs/upstream-master-unmerged-commits.md)

### 6-2. 사용법

```
/speckit-sync
```

옵션 없이 실행하면 목록을 갱신하고 가장 오래된 미반영 커밋부터 처리를
시작합니다. "5개만 처리하자" 같은 자연어 힌트를 붙일 수 있습니다.

### 6-3. 커밋별 처리 분기

각 upstream 커밋은 **LLM 정밀 분석**(커밋 의도 파악 + 우리 포크의 자체 변경
이력 대조 + 의미 충돌 검토)을 거쳐 넷 중 하나로 처리됩니다:

| 처리 | 조건 | 결과 |
|---|---|---|
| **cherry-pick** | 충돌 없음 + 의미 충돌 없음 | `git cherry-pick -x`로 그대로 반영 |
| **adapt** | 충돌 있으나 간단 (≤5 파일·≤150라인 가이드) | Superpowers 규율로 프로젝트에 맞게 수정 후 새 커밋 |
| **exclude** | 우리가 자체 커밋으로 해당 기능을 변경/제거함 | ledger 부록에 사유 기록, 코드 변경 없음 |
| **spec** | 대규모·큰 영향 (>15 파일, >500라인, DB 마이그레이션, enterprise 등) | 3절의 spec-kit 파이프라인으로 신규 기능처럼 개발 |

**모든 커밋은 처리 전에 분석 요약·권고·근거가 제시되고 사용자가 승인해야
합니다** — 자동 대량 처리는 하지 않습니다.

### 6-4. 세션 워크플로

```
1. 준비    master 최신화 → sync/upstream-YYYYMMDD 브랜치 생성 → 목록 갱신·요약
2. 루프    오래된 순으로 한 커밋씩: 신호 수집 → LLM 분석 → 권고 제시
           → 사용자 승인 → 실행(cherry-pick/adapt/exclude/spec) → 목록 갱신
3. 마감    변경 패키지 품질 게이트(make check-style / npm run check 등)
           → ledger 커밋 → master에 선형 병합(ff) → sync 브랜치 삭제
```

sync 세션 중에는 반영 커밋마다 커밋이 만들어집니다(워크플로 자체가 커밋 단위).

### 6-5. 추적 원리 — 별도 상태 파일 없음

- **반영 기록 = 커밋 본문**: cherry-pick/adapt 커밋 본문의
  `(cherry picked from commit <hash>)` / `Upstream: <GitHub 링크>` 참조가 기록.
- **제외/spec 기록 = ledger 부록**: 문서 하단 "제외된 커밋"·"spec 전환 커밋" 표.
- 목록 갱신 시 `git log master..upstream-master`에서 위 기록들을 **차감**해
  미반영 목록을 재생성 — 반영하면 목록에서 자동으로 사라지고 헤더의
  "마지막 반영 커밋"이 전진합니다.

### 6-6. 도우미 스크립트 (직접 실행 가능)

`.specify/scripts/bash/upstream-sync.sh`:

| 서브커맨드 | 용도 |
|---|---|
| `update` | fetch + 차감 규칙으로 미반영 목록 재생성 |
| `status` | 남은 개수·마지막 반영 커밋·부록 집계 |
| `next [n]` | 오래된 순 앞 n개 출력 (기본 1) |
| `signals <hash>` | 판단 재료: 충돌 예측(merge-tree)·규모·부재 경로·보호 경로·포크 자체 변경 이력 |
| `exclude <hash> <사유>` | 제외 부록 기록 후 목록 갱신 |
| `to-spec <hash> <specID>` | spec 전환 부록 기록 후 목록 갱신 |

### 6-7. 주의

- 오래된 순서를 건너뛰고 최신 커밋을 먼저 반영하지 않습니다 (의존성 붕괴).
- Translations(Weblate) 커밋은 우리 `ko.json` 변경과 상시 충돌 — adapt 시
  우리 문자열 보존.
- 리브랜드(OKR.BEST) 문자열과 Mattermost copyright 헤더는 보존
  (constitution 원칙 IV).

---

## 7. 결과물과 커밋 정책

| 경로 | 용도 | git |
|---|---|---|
| `specs/<NNN-기능>/` | spec·plan·tasks 등 명세 문서 (**공식 기준**) | 커밋 |
| `.specify/` | constitution·템플릿·스크립트 | 커밋 |
| `.claude/skills/speckit-*` · `.agents/skills/speckit-*` | Spec Kit 스킬 정의 | 커밋 |
| `CLAUDE.md` / `AGENTS.md` | 에이전트 컨텍스트 | 커밋 |
| `docs/superpowers/` | brainstorming 임시 초안 | .gitignore |
| `.worktrees/` | 격리 워크스페이스 | .gitignore |
| `.claude/settings.local.json` | 개인 권한 설정 | 커밋 안 함 |

`.specify/`에 자격증명·비밀값 금지.

**명세 문서 언어:** `specs/` 문서는 **한국어**로 작성합니다. 코드 식별자,
파일 경로, FR/SC 식별자, BDD 키워드(Given/When/Then)는 원형 유지.
(상세: [CLAUDE.md](CLAUDE.md))

**프로젝트 규칙 (Constitution 요약):** ① 패키지별 품질 게이트 (server:
`make check-style` + `make test-server`, webapp: `npm run check` +
`npm run check-types` + `npm run test`) ② webapp은 npm workspaces 전용
③ 동작 변경 시 테스트 동반 ④ 라이선스·리브랜드 충실성 (`spec-docs/rebrand.md`)
⑤ i18n `en.json`+`ko.json` 동기화 ⑥ 작업당 브랜치 + Conventional Commits + PR.
전문: [constitution.md](.specify/memory/constitution.md)

---

## 8. 문제 해결

| 증상 | 해결 |
|---|---|
| Superpowers 스킬이 안 보임 | 설치 후 새 세션/`/clear` 했는지 확인. 그래도 안 되면 재설치 (`/plugin`·`/plugins`) |
| brainstorming이 선택지 제시 없이 멋대로 다음 단계(`writing-plans` 등)로 감 | "멈추고, 정리된 설계로 `/speckit-specify` 실행해줘"라고 지시. 사용자 지시가 스킬 기본 동작보다 우선 |
| brainstorming 초안이 커밋되려 함 | `docs/superpowers/`는 임시 작업 폴더(.gitignore). 공식 기준 문서는 `specs/<NNN>/spec.md` — 커밋 대상에서 제외 지시 |
| spec에 `[NEEDS CLARIFICATION]`이 남음 | `/speckit-clarify` 실행 |
| Codex에서 명령이 안 먹음 | 접두사 `$` 확인 (`$speckit-specify`) |
| Spec Kit 버전 확인 | `specify version` |
| Spec Kit 업그레이드 | 관리자가 수행. ⚠️ `specify init . --force` 재실행 시 `constitution.md`가 템플릿으로 **덮어써짐**. 반드시 백업 후 진행 |

- 원본 도구 로컬 경로: Spec Kit `/home/sdh/dev-tools/spec-kit`, Superpowers `/home/sdh/dev-tools/superpowers`
- 처음부터 설치·다른 프로젝트 적용: [WORKFLOW_PORTING_GUIDE.md](WORKFLOW_PORTING_GUIDE.md)

