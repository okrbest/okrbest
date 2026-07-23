# Spec Kit + Superpowers 워크플로 이식 가이드

이 문서는 **검증된 spec-kit + superpowers 결합 워크플로를 
다른 프로젝트에 그대로 이식(옮겨 적용)**하는 절차를 정리한 것입니다. 워크플로 자체의 사용법은
[SPEC_KIT_GUIDE.md](SPEC_KIT_GUIDE.md)를 참고하세요. 이 문서는 "새 프로젝트에서
에이전트(Claude Code / Codex CLI)가 같은 방식으로 움직이게 만드는 법"만 다룹니다.

> **핵심 개념:** Spec Kit은 *무엇을·왜*(명세 파이프라인, 저장소에 커밋),
> Superpowers는 *어떻게*(구현 규율, 사용자 전역 플러그인). 이식 작업은
> ① 전역 도구 설치(개발자당 1회) + ② 프로젝트 기본 구성 파일(스캐폴딩) 생성(프로젝트당 1회) +
> ③ 에이전트 행동 규칙 추가(CLAUDE.md/AGENTS.md) 세 층으로 나뉩니다.

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

핵심: **저장소에 커밋되는 것**(스캐폴딩·constitution·CLAUDE.md)과 **개발자
개인 환경에 설치되는 것**(superpowers 플러그인·전역 CLAUDE.md)을 구분하면
이식 절차가 명확해집니다.

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

### 1-3. (선택) 개인 전역 원칙 — `~/.claude/CLAUDE.md`

brainstorming → speckit 핸드오프(작업 넘기기) 원칙(아래 3-2절)은 프로젝트 CLAUDE.md에도
넣지만, 여러 speckit 프로젝트를 오간다면 `~/.claude/CLAUDE.md`에도 같은 원칙을
한 벌 두면 프로젝트 파일이 누락돼도 에이전트가 규칙을 지킵니다.

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

Constitution은 나중에 `/speckit-plan`·`/speckit-implement`가 자동으로 참조하고,
superpowers 규율(TDD·verification)이 실행 중에 강제하는 근거가 됩니다.
**이 연결이 두 워크플로를 묶는 핵심**이므로 형식적으로 채우지 말 것.

### 2-3. `.gitignore`에 스크래치 경로 추가

```gitignore
# superpowers (local scratch; spec-kit specs/ is canonical)
.worktrees/
docs/superpowers/
```

superpowers `brainstorming`은 기본적으로 `docs/superpowers/`에 설계 초안을
쓰려고 하고, `using-git-worktrees`는 `.worktrees/`를 만듭니다. 둘 다
임시 파일이며 기준이 되는 원본(정본)은 `specs/<NNN>/`이므로 추적하지 않습니다.

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
root-cause debugging. See [SPEC_KIT_GUIDE.md](SPEC_KIT_GUIDE.md) for the role
split and combined workflow.
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

### 3-3. (선택) 명세 문서 언어 정책

한국어 팀이면 notion-cms의 "명세 문서 언어" 섹션을 복사해 spec 산출물(생성되는 문서)을
한국어로 고정합니다. 코드 식별자·파일 경로·FR/SC 식별자·BDD 키워드는 원형
유지라는 예외 조항까지 함께 복사하세요. 다른 언어 팀이면 해당 언어로 치환.

### 3-4. AGENTS.md 동기화

Codex를 함께 쓰면 위 섹션들을 AGENTS.md에도 동일하게 넣습니다. 명령 접두사만
다릅니다: Claude Code `/speckit-*`, Codex `$speckit-*`.

---

## 4. 이식 후 검증 체크리스트

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
- [ ] **동작 테스트 3 (규율):** `/speckit-implement` 중 실패 테스트 우선
      작성(TDD)과 검증 증거 후 완료 선언이 지켜지는지 확인

---

## 5. 커밋 정책 (새 프로젝트에도 동일 적용)

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

---

## 6. 자주 겪는 문제

| 증상 | 원인/해결 |
|---|---|
| superpowers 스킬이 안 보임 | 플러그인 설치 후 새 세션/`/clear` 안 함. 재시작. 그래도 안 되면 재설치 |
| brainstorming이 끝나자마자 spec 없이 계획으로 직행 | CLAUDE.md 핸드오프 섹션 누락. 3-2절 블록 추가 |
| brainstorming 산출물이 커밋됨 | `.gitignore`에 `docs/superpowers/` 누락 |
| `specify init --force` 후 constitution이 템플릿으로 초기화 | 백업에서 복원. 업그레이드 전 항상 백업 |
| Codex에서 speckit 명령 안 먹음 | 접두사 `$` 확인, `--integration codex`로 init 했는지 확인 |

