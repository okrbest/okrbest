# okrbest spec-kit preset

spec-kit 원본에 okrbest 구현 규율을 거는 커스터마이즈를 모은 preset이다.
이 디렉터리가 원본이고, `.specify/presets/okrbest/`는 CLI가 설치한 사본이다.
**사본이나 생성된 스킬 파일(`.claude`·`.agents`·`.cursor/skills/speckit-implement`)을
직접 고치지 않는다.** 다음 업그레이드에서 덮어써진다.

| 파일 | 바꾸는 것 |
|---|---|
| `commands/speckit.implement.outline.md` | `speckit-implement`의 `## Outline` 절 전체 (`replace-section`) |
| `templates/tasks-template.md` | tasks 템플릿 전체. Polish 단계의 완료 검증 3과제 |

## 고친 뒤 다시 설치하는 법

```bash
bash .specify/scripts/bash/reinstall-okrbest-preset.sh
bash .specify/scripts/bash/check-workflow-wiring.sh
```

스크립트는 preset을 지웠다가 다시 설치하고, 통합마다 `integration use` → `integration
upgrade --force`를 돌린다. preset은 활성 통합 하나에만 배달되고, `use`만으로는 manifest
해시가 갱신되지 않는 경우가 있어서다(spec-kit 1.4.5에서 확인). 마지막에 원래 기본 통합으로
되돌리고 `integration status`의 수정·누락 0건을 확인한다.

`commands/speckit.implement.outline.md`는 spec-kit 원본 템플릿 표기를 쓴다
(`{SCRIPT}`, `__SPECKIT_COMMAND_TASKS__` 등). 통합마다 렌더링된다.
`templates/tasks-template.md`는 렌더링되지 않으므로 `/speckit-tasks`처럼 쓴다.
`commands/speckit.implement.outline.md` 끝의 빈 줄은 다음 절 제목(`## Mandatory Post-Execution
Hooks`) 앞 빈 줄이다. `replace-section`은 구분 빈 줄을 넣어 주지 않으므로 지우지 않는다.

spec-kit을 올릴 때는 새 core `templates/commands/implement.md`의 Outline과 이 파일을
3-way merge한다. 절차: WORKFLOW_PORTING_GUIDE.md 8-2절.
