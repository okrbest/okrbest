# 기존 메시지 ID 위반 인벤토리 (T007)

**생성일**: 2026-07-29
**방법**: `webapp/channels/.eslintrc.json`에 `formatjs/enforce-id`(및 나머지 formatjs 규칙 8종)를 추가한 뒤, `../node_modules/.bin/eslint --ext .js,.jsx,.tsx,.ts ./src --format json`로 `webapp/channels/src` 전체(3,619개 파일, fatal parse error 0건)를 스캔했다.

## 결론: `formatjs/enforce-id` 위반 0건

전체 코드베이스에서 `formatjs/enforce-id` 위반이 **한 건도 발견되지 않았다**. 사전에 준비한 원래 계획(`admin_console` 등 디렉터리 단위 대규모 배치, tasks.md T017~T022 초안)은 "i18n 메시지를 사용하는 파일 수"를 배치 규모의 근거로 삼았는데, 이는 실제 "id가 없는 메시지 수"와 다른 지표였다 — 실측 결과 그 규모의 배치 작업은 불필요하다.

**검증**: 규칙 자체가 정상 동작함을 별도로 확인했다(id 없는 메시지를 담은 임시 테스트 파일을 린트해 `id must be specified` 오류가 정확히 발생하는 것을 확인 후 파일 삭제). 스캔 결과 fatal parse error가 0건이므로 파일이 스킵되어 위반이 안 잡힌 것도 아니다.

## 남은 문제: 동적(정적으로 추출 불가능한) id — `enforce-id`의 사각지대

`formatjs/enforce-id`는 "`id` 프로퍼티가 존재하는지"만 구조적으로 검사하며, 그 값이 정적 문자열 리터럴인지는 검사하지 않는다. 따라서 `id`가 변수(런타임 계산값)인 경우 규칙을 통과하지만, `@formatjs/cli extract`는 이런 id를 정적으로 풀 수 없어 해시 기반 id(`--id-interpolation-pattern`)를 대신 생성한다 — 이는 T006에서 관찰된 `"2/2yg+"`, `"8CHFwU"` 같은 해시 키의 원인이다.

**확인된 사례**:

| 파일 | 위치 | 패턴 |
|---|---|---|
| `webapp/channels/src/utils/password.tsx` | `checkPasswordComplexity` 내부 | `id: errorId` — `errorId`가 `'password' + 'Length' + 'Symbol' + ...` 형태로 런타임에 조합됨 |

**status**: `pending` — 개별 검토 필요(예: 각 조합 경로별로 별도의 정적 `defineMessages` 항목으로 분리). 대규모 디렉터리 배치가 아니라 **개별 사례 단위** 작업이며, 전수 조사는 이번 세션(MVP) 범위 밖으로 사용자가 확정했다. 추가 사례가 있는지는 후속 세션에서 더 정밀한 방법(AST 기반 검색 등, 단순 grep은 `id:` 오탐이 많아 부적합함을 확인)으로 조사한다.

## 변경된 키 (FR-005)

이번 세션에서는 `en.json`을 재생성·커밋하지 않았으므로(research.md #9), 변경된 키 목록이 없다. `en.json`↔소스 코드 드리프트(약 530개 키, 리브랜드 문자열 77건 포함)는 별도 후속 작업으로 이연됐다 — research.md #9 참고.

## User Story 3 범위 재확정

사용자 확인(2026-07-29): 위 결과에 따라 tasks.md의 User Story 3(T017~T022, 디렉터리 단위 대규모 배치)는 대폭 축소한다. 실행이 필요한 작업은:
1. 위 `password.tsx` 사례에 대한 개별 검토·수정.
2. `enforce-id` 도입 후에도 `en.json`이 정상적으로 100% id를 유지하는지 최종 확인(별도 배치 없이 즉시 만족 가능할 것으로 예상).

tasks.md는 이 결과를 반영해 별도로 갱신한다.
