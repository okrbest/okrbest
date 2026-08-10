# Spec Kit + Superpowers 워크플로 이식 가이드

이 문서는 **검증된 spec-kit + superpowers 결합 워크플로를 
다른 프로젝트에 그대로 이식(옮겨 적용)**하는 절차를 정리한 것입니다. 워크플로 자체의 사용법은
[SPEC_KIT_GUIDE.md](SPEC_KIT_GUIDE.md)를 참고하세요. 이 문서는 "새 프로젝트에서
에이전트(Claude Code / Codex CLI)가 같은 방식으로 움직이게 만드는 법"만 다룹니다.

> **핵심 개념:** Spec Kit은 *무엇을·왜*(명세 파이프라인, 저장소에 커밋),
> Superpowers는 *어떻게*(구현 규율, 사용자 전역 플러그인). 이식 작업은
> ① 전역 도구 설치(개발자당 1회) + ② 프로젝트 기본 구성 파일(스캐폴딩) 생성(프로젝트당 1회) +
> ③ 에이전트 행동 규칙 추가(CLAUDE.md/AGENTS.md) + ④ **구현 규율 배선**(4절)
> 네 층으로 나뉩니다.

> ⚠️ **④를 건너뛰면 워크플로가 절반만 작동합니다.** 2026-08 okrbest-plugin-boards에서
> 45개 과제짜리 기능을 구현한 뒤 규율 적용 실태를 측정했습니다. 게이트 검증은
> 지켜졌으나 실패 테스트 우선은 9쌍 중 4쌍만 적용됐고, PR 조항은 74커밋 동안 한
> 번도 지켜지지 않았습니다. 원인과 대책은 4절에 있습니다.

---

## 0. 이식 대상 요약 — 무엇이 어디에 사는가

| 구성요소 | 위치 | 이식 방법 |
|---|---|---|
| Spec Kit 스캐폴딩 (`.specify/`, `.claude/skills/speckit-*`, `.agents/skills/speckit-*`) | 프로젝트 저장소 (커밋) | `specify init` 으로 새로 생성 |
| Constitution (`.specify/memory/constitution.md`) | 프로젝트 저장소 (커밋) | `/speckit-constitution` 으로 새 프로젝트에 맞게 작성 |
| 에이전트 행동 규칙 (핸드오프·언어 정책) | `CLAUDE.md` / `AGENTS.md` (커밋) | 이 저장소의 섹션을 **복사 후 수정** |
| Superpowers 플러그인 | 사용자 전역 (`~/.claude`) | 개발자마다 1회 설치 — 저장소에 안 들어감 |
| 개인 전역 원칙 | `~/.claude/CLAUDE.md` | 개인 환경에 1회 반영 (선택) |
| 임시 파일(스크래치) 무시 규칙 | `.gitignore` (커밋) | 2줄 추가 |
| **구현 규율 배선** (`speckit-implement` 스킬 패치) | 프로젝트 저장소 (커밋) | 4절 — 원본에는 없다 |
| **검증 과제 고정** (`tasks-template.md`) | 프로젝트 저장소 (커밋) | 4-3절 |
| **브랜치 보호·rebase 전용 머지** | GitHub 저장소 설정 | 6절 — 문서로는 안 지켜진다 |

핵심: **저장소에 커밋되는 것**(스캐폴딩·constitution·CLAUDE.md)과 **개발자
개인 환경에 설치되는 것**(superpowers 플러그인·전역 CLAUDE.md)을 구분하면
이식 절차가 명확해집니다.

굵게 표시한 셋은 spec-kit 원본에 없어 손으로 넣어야 하는 것들입니다. 이 셋이
빠지면 파이프라인은 돌지만 규율이 안 걸립니다.

---

## 1. 전역 도구 설치 (개발자당 1회 — 이미 되어 있으면 생략)

### 1-1. `specify` CLI

준비물: [uv](https://docs.astral.sh/uv/), Python 3.11+, git.

```bash
uv tool install specify-cli --from git+https://github.com/github/spec-kit.git@vX.Y.Z
specify version   # 확인 (이 저장소 기준 0.10.3)
```

최신 태그는 [spec-kit Releases](https://github.com/github/spec-kit/releases)에서 확인합니다.

### 1-2. Superpowers 플러그인

에이전트 안에서 입력하는 **대화형 명령**입니다.

- **Claude Code:** `/plugin install superpowers@claude-plugins-official`
- **Codex CLI:** `/plugins` → `superpowers` 검색 → Install
  (subagent용 `~/.codex/config.toml`에 `[features] multi_agent = true` 필요)

설치 후 **새 세션 시작 또는 `/clear`** 해야 SessionStart 훅이 적용됩니다.
새 세션에서 `test-driven-development`, `brainstorming` 스킬이 보이면 정상.

**훅이 자동으로 주입하는 것은 `using-superpowers` 하나뿐입니다.** 그 안에 "적용되는
스킬을 호출하라"는 지시가 들어 있을 뿐, `test-driven-development` 같은 개별 스킬은
`Skill` 도구로 불러야 지침이 로드됩니다. 플러그인 소스에서 확인한 사실입니다
(`hooks/session-start`가 `skills/using-superpowers/SKILL.md`만 읽어 주입).
이 차이가 4절의 배선이 필요한 이유입니다.

### 1-3. (선택) 개인 전역 원칙

여러 speckit 프로젝트를 오간다면 핸드오프 원칙(아래 3-2절)을 개인 전역 설정에도
한 벌 두면 프로젝트 파일이 누락돼도 규칙이 지켜집니다. 다만 도구마다 위치가 다르고
일부는 파일이 아예 없습니다.

| 도구 | 전역 설정 | 비고 |
|---|---|---|
| Claude Code | `~/.claude/CLAUDE.md` | 모든 프로젝트에 적용 |
| Codex CLI | `~/.codex/AGENTS.md` | Claude 파일과 별개 — 손으로 맞춰야 한다 |
| Cursor | **없음** | User Rules는 앱 UI에 저장(`state.vscdb`). 파일로 못 넣는다 |
| Gemini CLI | **없음** | 프로젝트 `GEMINI.md`만 |

**전역에 의존하지 마세요.** 파일이 갈라지면 한쪽이 낡습니다. 규칙의 정본은 프로젝트
저장소에 두고(3절·4절), 전역은 보조로만 씁니다. Cursor·Gemini는 전역 자체가 없으므로
저장소 규칙이 유일한 경로입니다.

---

## 2. 새 프로젝트 스캐폴딩 (프로젝트당 1회)

### 2-1. `specify init`

프로젝트 루트에서 사용할 에이전트별로 실행합니다(같은 디렉터리에 공존 가능):

```bash
specify init . --integration claude --script sh --force   # → .claude/skills/, CLAUDE.md
specify init . --integration codex  --script sh --force   # → .agents/skills/, AGENTS.md
```

두 명령 모두 공유 인프라 `.specify/`(스크립트·템플릿·memory)를 설치합니다.
`claude`·`codex` CLI가 PATH에 없으면 `--ignore-agent-tools` 추가.

> ⚠️ 이미 spec-kit이 설치된 프로젝트에서 `--force` 재실행 시
> `constitution.md`가 템플릿으로 **덮어써집니다**. 업그레이드 전 반드시 백업.

### 2-2. Constitution 작성

`/speckit-constitution`을 실행하거나 `.specify/memory/constitution.md`를 직접
편집해 **새 프로젝트의 규칙**을 채웁니다. notion-cms의 constitution을 그대로
복사하지 마세요 — 원칙의 *구조*만 참고하고 내용은 프로젝트에 맞게 다시 정합니다.

notion-cms가 쓰는 원칙 구조 (참고용):

1. 패키지 매니저 단일화 (예: Yarn 전용, 경쟁 lockfile 금지)
2. 머지 전 품질 게이트 (lint + format + type-check 통과)
3. 동작 변경 시 테스트 동반 (회귀 테스트 포함)
4. 문서 정책 (예: 영·한 이중 문서 동기화)
5. 집중 브랜치 + Conventional Commits (`main` 직접 커밋 금지)

Constitution은 `/speckit-plan`·`/speckit-analyze`·`/speckit-implement`가 자동으로
참조합니다. **이 연결이 두 워크플로를 묶는 핵심**이므로 형식적으로 채우지 마세요.

**원칙은 증거를 요구하는 형태로 씁니다.** 이것이 이식에서 가장 중요한 한 가지입니다.
okrbest-plugin-boards에서 원칙별 준수 실태를 측정한 결과가 명확합니다.

| 원칙 문구 | 결과 |
|---|---|
| "게이트를 통과하고 **그 출력을 완료 근거로 제시한다**" | 지켜짐 |
| "동작을 바꾸는 변경은 테스트를 **동반한다**" | 9쌍 중 4쌍만 |

"하라"로 끝나는 원칙은 사후에 형식만 맞춰도 위반이 아닙니다. "그 출력을 근거로
제시하라"로 쓰면 증거가 없을 때 바로 드러납니다. 같은 규율인데 문장 형태만으로
결과가 갈렸습니다.

원칙을 쓸 때 스스로 물어보세요 — **이 원칙을 어겼는지 무엇으로 확인하나?**
답이 없으면 그 원칙은 장식입니다.

세부 예:

- 테스트 원칙 → "테스트 과제는 **실패 출력을 남긴 뒤에만** 완료로 표시한다"
- 게이트 원칙 → "**실패 목록 diff**로 판정한다" (개수 비교는 기준선이 더러운
  저장소에서 무의미하다)
- 브랜치 원칙 → "PR → `gh pr merge --rebase` → `git pull --ff-only`" (절차를 적는다)

### 2-3. `.gitignore`에 스크래치 경로 추가

```gitignore
# superpowers (local scratch; spec-kit specs/ is canonical)
.worktrees/
docs/superpowers/
```

superpowers `brainstorming`은 기본적으로 `docs/superpowers/`에 설계 초안을
쓰려고 하고, `using-git-worktrees`는 `.worktrees/`를 만듭니다. 둘 다
임시 파일이며 기준이 되는 원본(정본)은 `specs/<NNN>/`이므로 추적하지 않습니다.

`.worktrees/`는 예방 차원입니다 — okrbest-plugin-boards는 기능 5개를 진행하는 동안
워크트리를 한 번도 쓰지 않았습니다. 브랜치 하나로 충분합니다. 줄을 남겨 두되
워크플로 문서에서 워크트리를 필수처럼 적지는 마세요.

---

## 3. 에이전트 행동 규칙 추가 — CLAUDE.md / AGENTS.md

`specify init`이 만든 CLAUDE.md는 spec-kit 관련 내용만 담고 있습니다.
**두 도구의 역할 분담과 핸드오프 규칙**을 직접 추가해야 에이전트가 이
저장소처럼 움직입니다. 아래 섹션들을 새 프로젝트의 CLAUDE.md(및 AGENTS.md)에
추가하세요.

### 3-1. 역할 분담 선언

```markdown
## Workflow

This repository combines **spec-kit** (specification pipeline) and **superpowers**
(implementation discipline). spec-kit owns the spec/plan artifacts under `specs/`
(`/speckit-specify`, `/speckit-plan`, `/speckit-tasks`); superpowers governs
implementation — test-driven development, verification-before-completion, and
root-cause debugging. These skills are **not applied automatically**: the
SessionStart hook injects only `using-superpowers`, and `/speckit-implement`
invokes the individual skills at its discipline-loading step. See
[SPEC_KIT_GUIDE.md](SPEC_KIT_GUIDE.md) for the role split and combined workflow.
```

(SPEC_KIT_GUIDE.md도 새 저장소로 복사해 두면 팀원 온보딩 문서가 됩니다.
2절 "이미 저장소에 커밋되어 있습니다" 같은 저장소 종속 문구는 새 프로젝트
상태에 맞게 수정.)

### 3-2. brainstorming → speckit 핸드오프 규칙 (그대로 복사)

이 섹션은 notion-cms CLAUDE.md에 "새 speckit 프로젝트를 만들 때 그대로 복사"
하도록 명시된 블록입니다. **문구 수정 없이 복사**하세요:

```markdown
## Brainstorming → /speckit-specify 핸드오프

기능 작업은 **복잡도로 분기**한다.

- **단순/명확**: 브레인스토밍 없이 바로 `/speckit-specify`.
- **복잡**: superpowers `brainstorming`으로 의도·요구사항·설계를 정리한 뒤 `/speckit-specify`로 넘긴다.

**핵심 규칙 — brainstorming → speckit 전환은 반드시 "명시적 사용자 선택 단계"를 거친다.**

- brainstorming을 자동 종료하거나 건너뛰지 않는다. 사용자가 넘기라고 하기 전엔 speckit으로 진입 금지.
- 설계가 정리되면 전환을 눈에 보이게 제시하고 사용자가 고른다:
  ① `/speckit-specify`로 진행  ② 더 다듬기  ③ 중단/보류.
- 핸드오프 시점과 넘길 내용(정리된 설계)을 사용자가 확인한 뒤 결정한다.
```

**왜 필요한가:** superpowers `brainstorming`은 spec-kit을 모르며, 끝나면
자기 식대로 `writing-plans`를 호출하고 `docs/superpowers/`에 문서를 커밋하려
합니다. 이 규칙이 두 기본 동작을 덮어씁니다(사용자 지시 > 스킬 규칙):

| 분기점 | brainstorming 기본값 | 결합 워크플로에서는 |
|---|---|---|
| 다음 단계 | `writing-plans` 호출 | `/speckit-specify`로 명시적 전환 |
| 설계 문서 | `docs/superpowers/`에 커밋 | gitignore 임시 파일. 정본은 `specs/<NNN>/spec.md` |

### 3-3. (선택) 명세 문서 언어와 문체 정책

한국어 팀이면 "명세 문서 언어" 섹션을 복사해 spec 산출물을 한국어로 고정합니다.
코드 식별자·파일 경로·FR/SC 식별자·BDD 키워드는 원형 유지라는 예외 조항까지 함께
복사하세요. 다른 언어 팀이면 해당 언어로 치환.

**언어만 정하면 절반입니다.** 문체를 안 정하면 한국어이긴 하되 번역투인 문서가
나옵니다. okrbest-plugin-boards에서 실제로 그랬습니다 — "한국어로 쓴다"는 에이전트
파일 4종에 커밋돼 있었고 문체 규칙은 개인 홈에만 있어서, 다른 도구로 `specs/`를
쓰면 걸리지 않았습니다.

문체 규칙의 **정본은 constitution 한 곳**에 두고 에이전트 파일에는 압축본과 참조만
싣습니다. 네 파일에 전문을 복사하면 갈라집니다.

번역투 목록은 어미·조사 패턴만 잡습니다. 아래 셋을 함께 넣어야 명사구 과적재가
걸립니다.

- **명사화 금지** — "증거 요구 없음" → "증거를 요구하지 않는다"
- **영어 은유 직역 금지** — bridge·lever·hub 계열은 한국어에서 굳지 않았다
- **소제목에 관형절("~하는 X") 금지** — 서술문이나 의문문으로

### 3-4. AGENTS.md 동기화

Codex를 함께 쓰면 위 섹션들을 AGENTS.md에도 동일하게 넣습니다. 명령 접두사만
다릅니다: Claude Code `/speckit-*`, Codex `$speckit-*`.

---

## 4. 구현 규율 배선 (건너뛰면 절반만 작동)

3절까지는 명세 파이프라인이 돕니다. 그런데 `/speckit-implement`가 도는 동안 구현
규율이 실제로 걸리느냐는 별개 문제입니다.

### 4-1. 왜 필요한가 — 측정 결과

`speckit-implement` 스킬은 spec-kit이 배포하는 224줄짜리 원본에 **superpowers 언급이
0회**입니다(okrbest·notion-cms·okrbest-plugin-boards 세 프로젝트에서 md5까지 동일).
문서를 읽어 들이지만 규율로 바꾸는 단계가 없습니다.

2026-08 okrbest-plugin-boards에서 45개 과제짜리 기능을 마친 뒤 측정한 결과입니다.

| 규율 | 결과 | 왜 |
|---|---|---|
| 게이트 검증 | 작동 | constitution이 **증거 제시**를 요구 |
| 근본 원인 디버깅 | 작동 | 세션 중 스킬이 로드돼 있었음 |
| 실패 테스트 우선 | 9쌍 중 4쌍 | 스킬 미호출 + 증거 요구 없음 |
| 종단 검증 | 워크플로 밖 | 소비 단계 자체가 없음 |
| PR 경유 머지 | 74커밋 0건 | 기계적 차단 없음 |

원본 스킬의 문장에 빠져나갈 구멍이 있습니다.

- `Execute test tasks before their corresponding implementation tasks` — 실패를
  **보라는** 요구가 없어 사후에 써도 형식상 준수
- `Tests before code: **If you need to** write tests…` — "필요하면"이 면제 조항
- `Validate that tests pass` — 기준선 대비 요구 없음. 기준선이 더러운 저장소에서 무의미

### 4-2. `speckit-implement` 스킬에 네 곳을 넣는다

`.claude/skills/speckit-implement/SKILL.md`(Codex는 `.agents/skills/`)를 고칩니다.
스킬은 프로젝트마다 vendoring되므로 저장소별로 고치면 됩니다.

**① 문서 로드 단계 뒤 — 규율 호출과 문서 매핑**

```markdown
3-bis. **구현 규율 로드** (필수 — 다음 단계 전):

   `Skill` 도구로 호출한다. 자동 적용되지 않는다.
   - `superpowers:test-driven-development`
   - `superpowers:verification-before-completion`

   예상 밖 실패를 만나면 그 자리에서 `superpowers:systematic-debugging`을 부른다.

   방금 읽은 문서를 규율로 바꾼다. 각 행의 증거가 없으면 그 과제는 완료가 아니다.

   | 문서 | 뽑는 것 | 증거 |
   |---|---|---|
   | tasks.md 테스트 과제 | TDD 대상 | 구현 전 실패 출력 |
   | tasks.md 구현 과제 | 위 실패가 통과로 바뀔 대상 | 같은 테스트의 통과 출력 |
   | plan.md Constitution Check | 단계별 게이트 | 게이트 출력 + 기준선 diff |
   | spec.md SC-### | 종단 판정 기준 | 실측값 (추정 금지) |
   | quickstart.md | 종단 검증 절차 | 절별 통과/실패 기록 |
   | contracts/ | 계약 테스트 대상 | 응답·문턱마다 대응하는 테스트 |

   **기준선을 먼저 측정한다.** `git stash -u`로 미추적 파일까지 치운 뒤 게이트를
   돌려 실패 목록을 저장한다. 회귀는 개수가 아니라 목록 diff로 판정한다.
```

**② TDD 문장 교체**

```diff
-   - **Follow TDD approach**: Execute test tasks before their corresponding implementation tasks
+   - **TDD (증거 기반)**: 테스트 과제는 실패 출력을 남긴 뒤에만 [X]로 표시한다.
+     첫 실행에서 통과한 테스트는 되돌려 실패를 확인하거나 `미검증`으로 적는다

-   - **Tests before code**: If you need to write tests for contracts, entities, and integration scenarios
+   - **Tests before code**: tasks.md가 테스트 과제를 지정한 모든 쌍에 적용한다.
+     건너뛰려면 사유를 해당 과제 옆에 적는다
```

**③ 완료 검증 교체 — quickstart.md를 여기서 쓴다**

원본은 `quickstart.md`를 읽기만 하고 쓰지 않습니다. 이 소비 단계가 빠져 있어
결함이 게이트를 통과해 남습니다.

```diff
 9. Completion validation:
-   - Validate that tests pass and coverage meets requirements
+   - 품질 게이트 — 실패 목록이 기준선과 같은지 diff로 보인다
+   - 종단 검증 — 빌드·배포한 뒤 quickstart.md를 실제 환경에서 훑는다
+   - SC 검증 — spec.md의 각 SC-###를 실측값으로 확인한다
+   - 결과를 tasks.md 하단에 표로 기록한다
```

**④ 세션 마감 절 추가** (5절 참조)

### 4-3. tasks 템플릿에 검증 과제를 고정한다

스킬만 고치면 `tasks.md`가 그 과제를 안 만들 수 있습니다.
`.specify/templates/tasks-template.md`의 마지막 Phase에 넣습니다.

```markdown
- [ ] TXXX 품질 게이트 — 실패 목록이 기준선과 같은지 diff로 보인다
- [ ] TXXX 종단 검증 — 빌드·배포 후 quickstart.md를 실제 환경에서 훑고 결과 기록
- [ ] TXXX SC 검증 — spec.md의 SC-### 각각을 실측값으로 확인
```

okrbest-plugin-boards의 005 기능에서 이 과제를 넣어 뒀기에 게이트 5종을 전부 통과한
상태에서 결함 하나를 잡았습니다. 안 넣었으면 놓쳤습니다.

### 4-4. 종단 검증이 왜 별도 단계인가

기능 001~004 모두 **게이트를 통과한 뒤** 수정이 이어졌습니다. 004는 완료 선언
후 `fix:` 커밋이 5개 붙었고 그중 하나는 "피드백 3건"이었습니다 — 사용자가 직접
써 보고 알려준 것입니다.

단위 테스트가 약한 게 아니라, 드래그·선택기·실시간 렌더처럼 **화면을 조작해야만
드러나는 결함**이 많은 코드베이스였습니다. `/speckit-plan`이 이미 기능마다
`quickstart.md`를 만들고 있으니, 소비 단계만 붙이면 됩니다.

---

## 5. 이식 후 검증 체크리스트

새 프로젝트에서 순서대로 확인:

- [ ] `specify version` 동작, `.specify/`·`.claude/skills/speckit-*` 존재
- [ ] 새 세션에서 superpowers 스킬(`brainstorming`, `test-driven-development`) 보임
- [ ] `constitution.md`가 템플릿이 아니라 실제 프로젝트 규칙으로 채워짐
- [ ] CLAUDE.md에 Workflow + 핸드오프 섹션 존재 (AGENTS.md도 동일)
- [ ] `.gitignore`에 `.worktrees/`·`docs/superpowers/` 포함
- [ ] **동작 테스트 1 (핸드오프):** 복잡한 기능을 "brainstorming부터 하자"로
      시작 → 설계 정리 후 에이전트가 `writing-plans`로 새지 않고
      ①specify ②더 다듬기 ③보류 선택지를 제시하는지 확인
- [ ] **동작 테스트 2 (파이프라인):** `/speckit-specify <간단한 기능>` →
      기능 브랜치 + `specs/001-*/spec.md` 생성 확인
- [ ] `speckit-implement` 스킬에 4-2절 네 곳이 들어갔는가
      (`grep -c superpowers .claude/skills/speckit-implement/SKILL.md`가 0이 아니어야 함)
- [ ] `tasks-template.md`에 게이트·종단·SC 검증 과제가 고정돼 있는가
- [ ] constitution의 원칙이 **증거를 요구하는 문장**인가 (2-2절)
- [ ] 기본 브랜치에 보호가 걸려 직접 push가 막히는가 (6절)
- [ ] **동작 테스트 3 (규율):** `/speckit-implement`가 3-bis에서 스킬을 실제로
      호출하는지, 테스트 과제마다 실패 출력이 남는지 확인.
      호출 없이 "TDD를 지키겠다"고만 하면 지켜지지 않는다 — 측정된 사실이다
- [ ] **동작 테스트 4 (종단):** 기능 하나를 끝까지 돌린 뒤, 게이트 통과 후에 붙는
      `fix:` 커밋 수를 센다. 종단 검증이 작동하면 이 수가 줄어든다

---

## 6. 브랜치·PR 정책 (새 프로젝트에도 동일 적용)

| 경로 | git |
|---|---|
| `.specify/` (memory·templates·scripts) | 커밋 |
| `.claude/skills/speckit-*` · `.agents/skills/speckit-*` | 커밋 |
| `CLAUDE.md` / `AGENTS.md` / `SPEC_KIT_GUIDE.md` | 커밋 |
| `specs/<NNN-기능>/` | 커밋 (정본) |
| `.claude/settings.local.json` (개인 권한 설정) | 커밋 안 함 |
| `docs/superpowers/`, `.worktrees/` | .gitignore |
| superpowers 플러그인 | 저장소 밖 (사용자 전역) |

`.specify/`에 자격증명·비밀값 금지.

### 브랜치와 병합

**브랜치는 작업을 시작하기 전에 만듭니다** — brainstorming을 하는 기능이면 그 대화
전에. 기본 브랜치에서 설계를 시작하면 되돌릴 지점이 없습니다.

```bash
git switch <기본 브랜치> && git pull --ff-only
git switch -c <NNN>-<기능-슬러그>
```

마감은 넷입니다.

```bash
# 1. 게이트 + 종단 검증 증거를 제시한 뒤
git push -u origin "$(git branch --show-current)"
gh pr create --base <기본 브랜치> --fill
# 2. 사용자 확인 후
gh pr merge --rebase --delete-branch
git switch <기본 브랜치> && git pull --ff-only
```

**문서만으로는 지켜지지 않습니다.** okrbest-plugin-boards의 constitution에 "PR 경유
머지"가 적혀 있었지만 74커밋 동안 PR이 0건이었습니다. okrbest에서는 같은 규칙이
지켜졌는데, 문서가 좋아서가 아니라 **GitHub ruleset이 직접 push를 막았기 때문**입니다.

새 프로젝트에도 기계적 강제를 겁니다.

```bash
gh api -X PUT repos/{owner}/{repo}/branches/{branch}/protection --input - <<'JSON'
{"required_status_checks":null,"enforce_admins":false,
 "required_pull_request_reviews":null,"restrictions":null,
 "allow_force_pushes":false,"allow_deletions":false}
JSON

gh api -X PATCH repos/{owner}/{repo} \
  -F allow_squash_merge=false -F allow_merge_commit=false \
  -F allow_rebase_merge=true -F delete_branch_on_merge=true
```

- 직접 push 차단 → PR이 유일한 경로
- squash·merge commit 비활성 → **rebase만 남아 선형 이력이 설정으로 보장**
- 1인 개발이면 리뷰 승인 요건은 넣지 않습니다 — 승인자가 자기 자신이면 PR이 막힙니다

주의: rebase 병합 후 로컬 브랜치는 SHA가 바뀌어 `git branch -d`가 거부합니다.
`-D`를 씁니다. `gh`가 upstream remote를 기준 저장소로 잡으면
`gh repo set-default <owner>/<repo>`로 고정합니다.

---

## 7. 자주 겪는 문제

| 증상 | 원인/해결 |
|---|---|
| superpowers 스킬이 안 보임 | 플러그인 설치 후 새 세션/`/clear` 안 함. 재시작. 그래도 안 되면 재설치 |
| brainstorming이 끝나자마자 spec 없이 계획으로 직행 | CLAUDE.md 핸드오프 섹션 누락. 3-2절 블록 추가 |
| brainstorming 산출물이 커밋됨 | `.gitignore`에 `docs/superpowers/` 누락 |
| `specify init --force` 후 constitution이 템플릿으로 초기화 | 백업에서 복원. 업그레이드 전 항상 백업 |
| Codex에서 speckit 명령 안 먹음 | 접두사 `$` 확인, `--integration codex`로 init 했는지 확인 |
| implement 중 TDD·검증이 안 지켜짐 | `speckit-implement` 스킬에 4-2절 배선 누락. 원본 224줄에는 superpowers 언급이 0회다 |
| 게이트를 통과했는데 결함이 남음 | 종단 검증 단계 누락. 4-3절 과제를 tasks 템플릿에 고정 |
| 테스트를 썼는데 아무것도 못 잡음 | 구현 후에 써서 첫 실행부터 통과한 것. 되돌려 실패를 확인하거나 미검증 표시 |
| PR 없이 기본 브랜치에 직접 커밋됨 | 브랜치 보호 미설정. 6절의 `gh api` 두 줄 |
| 한국어인데 번역투가 심함 | 언어만 정하고 문체를 안 정함. 3-3절 |

