<!-- SPECKIT START -->
For additional context about technologies to be used, project structure,
shell commands, and other important information, read the current plan:
specs/012-image-preview-zoom-pan/plan.md
<!-- SPECKIT END -->

## Workflow

This repository combines **spec-kit** (specification pipeline) and **superpowers**
(implementation discipline). spec-kit owns the spec/plan artifacts under `specs/`
(`$speckit-specify`, `$speckit-plan`, `$speckit-tasks`); superpowers governs
implementation — test-driven development, verification-before-completion, and
root-cause debugging. See [SPEC_KIT_GUIDE.md](SPEC_KIT_GUIDE.md) for the role
split and combined workflow. Project rules live in
`.specify/memory/constitution.md`.

**이 규율은 자동 적용되지 않는다.** SessionStart 훅은 `using-superpowers` 하나만
주입한다. 개별 스킬은 `Skill` 도구로 호출해야 지침이 로드되며, 호출 지점은
`$speckit-implement`의 구현 규율 로드(3-bis) 단계다. 사실의 정본은
[constitution 원칙 VII](.specify/memory/constitution.md). 배선 확인은
`bash .specify/scripts/bash/check-workflow-wiring.sh`.

구현 중 남길 증거 — 테스트 과제는 **구현 전 실패 출력**, 게이트는 **기준선 대비 실패
목록 diff**, 종단 판정은 quickstart.md 실주행과 SC-### 실측값. 증거가 없으면 완료가
아니다 (원칙 I·III).

Upstream(mattermost/mattermost) 커밋 선별 반영은 `$speckit-sync`를 사용한다.
미반영 목록(ledger)은 `docs/upstream-master-unmerged-commits.md`.

## Brainstorming → $speckit-specify 핸드오프

기능 작업은 **복잡도로 분기**한다.

- **단순/명확**: 브레인스토밍 없이 바로 `$speckit-specify`.
- **복잡**: superpowers `brainstorming`으로 의도·요구사항·설계를 정리한 뒤 `$speckit-specify`로 넘긴다.

**핵심 규칙 — brainstorming → speckit 전환은 반드시 "명시적 사용자 선택 단계"를 거친다.**

- brainstorming을 자동 종료하거나 건너뛰지 않는다. 사용자가 넘기라고 하기 전엔 speckit으로 진입 금지.
- 설계가 정리되면 전환을 눈에 보이게 제시하고 사용자가 고른다:
  ① `$speckit-specify`로 진행  ② 더 다듬기  ③ 중단/보류.
- 핸드오프 시점과 넘길 내용(정리된 설계)을 사용자가 확인한 뒤 결정한다.

## 명세 문서 언어와 문체 (Spec artifact language)

이 저장소의 spec-kit 산출물(`specs/<NNN-feature>/`의 `spec.md`, `plan.md`,
`tasks.md`, `checklists/`, 분석 노트 등)은 한국인 기획자·개발자를 위해 **한국어로
작성한다**. `$speckit-specify`, `$speckit-plan`, `$speckit-tasks`,
`$speckit-clarify`, `$speckit-analyze` 등 향후 모든 spec-kit 작업에 적용된다.

- 코드 식별자, 파일 경로(`server/`, `webapp/channels/` 등), 셸 명령
  (`make check-style`, `npm run check` 등), FR/SC 식별자, BDD 키워드
  (Given/When/Then)는 원형을 유지한다.
- 템플릿이 영어로 산출되더라도 작성·갱신 시 한국어로 옮긴다.

문체 요약 — **번역투 금지**("~하는 것을 확실히 하세요"→"~한다", 이중 피동, 불필요한
"~적인·~를 통해"), **명사화 금지**(동사로 쓸 수 있으면 동사로), **영어 은유 직역
금지**(bridge·lever·hub 계열), **소제목에 관형절("~하는 X") 금지**(서술문·의문형으로).
짧은 문장, 능동태, 단정적 서술.

**정본은 [constitution 원칙 VIII](.specify/memory/constitution.md) 한 곳이다.**
여기 있는 것은 압축본이다 — 규칙을 고칠 때는 constitution을 고친다.
