# 기존 메시지 ID 위반 인벤토리 (T007)

**생성일**: 2026-07-29
**방법**: `webapp/channels/.eslintrc.json`에 `formatjs/enforce-id`(및 나머지 formatjs 규칙 8종)를 추가한 뒤, `../node_modules/.bin/eslint --ext .js,.jsx,.tsx,.ts ./src --format json`로 `webapp/channels/src` 전체(3,619개 파일, fatal parse error 0건)를 스캔했다.

## 결론: `formatjs/enforce-id` 위반 0건

전체 코드베이스에서 `formatjs/enforce-id` 위반이 **한 건도 발견되지 않았다**. 사전에 준비한 원래 계획(`admin_console` 등 디렉터리 단위 대규모 배치, tasks.md T017~T022 초안)은 "i18n 메시지를 사용하는 파일 수"를 배치 규모의 근거로 삼았는데, 이는 실제 "id가 없는 메시지 수"와 다른 지표였다 — 실측 결과 그 규모의 배치 작업은 불필요하다.

**검증**: 규칙 자체가 정상 동작함을 별도로 확인했다(id 없는 메시지를 담은 임시 테스트 파일을 린트해 `id must be specified` 오류가 정확히 발생하는 것을 확인 후 파일 삭제). 스캔 결과 fatal parse error가 0건이므로 파일이 스킵되어 위반이 안 잡힌 것도 아니다.

## 남은 문제: 동적(정적으로 추출 불가능한) id — `enforce-id`의 사각지대

`formatjs/enforce-id`는 "`id` 프로퍼티가 존재하는지"만 구조적으로 검사하며, 그 값이 정적 문자열 리터럴인지는 검사하지 않는다. 따라서 `id`가 변수(런타임 계산값)인 경우 규칙을 통과하지만, `@formatjs/cli extract`는 이런 id를 정적으로 풀 수 없어 해시 기반 id(`--id-interpolation-pattern`)를 대신 생성한다 — 이는 T006에서 관찰된 `"2/2yg+"`, `"8CHFwU"` 같은 해시 키의 원인이다.

**확인된 사례 (모두 해결됨, status: `completed`)**:

T018에서 단순 grep 대신 `@formatjs/cli extract --extract-source-location`으로 실제 해시 id의 소스 위치를 역추적하는 정밀한 방법을 사용해 전수 조사했다(해시 id는 `[A-Za-z0-9+/]{6}` 패턴으로 식별 가능, `id-interpolation-pattern` 설정과 일치).

| 파일 | 위치 | 패턴 | 조치 |
|---|---|---|---|
| `webapp/channels/src/utils/password.tsx` | `isValidPassword` 내부 | `id: errorId` — `errorId`가 `'passwordError' + 'Lowercase' + ...` 형태로 런타임에 조합됨 | 이미 존재하던 `passwordErrors`(defineMessages) 객체를 같은 키로 조회하도록 수정. 부수 효과로 사용자에게 더 구체적인 오류 문구가 표시됨(기존에는 일반 문구만 표시됨) |
| `webapp/channels/src/components/announcement_bar/configuration_bar/configuration_bar.tsx` | 라이선스 만료/미리보기 모드 배너 2곳 | `id: AnnouncementBarMessages.XXX` — dismissal 추적용 상수를 i18n id로 재사용 | `utils/constants.tsx`의 기존 `defineMessages` 블록을 `announcementBarMessageDescriptors`로 export해 재사용 |
| `webapp/channels/src/components/integrations/add_command/add_command.tsx` | 헤더/푸터/로딩 텍스트 3곳 | `id: ('literal')` — 불필요한 괄호가 `@formatjs/cli`의 정적 분석을 방해 | 다른 `integrations/add_*` 컴포넌트와 동일하게 `defineMessages` + 직접 디스크립터 전달 패턴으로 통일(겸사겸사 `formatMessage(...)`를 `as MessageDescriptor`로 잘못 캐스팅하던 타입 안전성 문제도 해결) |

**최종 확인**: 전체 코드베이스 재스캔 결과 해시 기반 id가 **0건**이다. 세 경우 모두 `en.json`/`ko.json`에 해당 id가 이미 올바르게 번역되어 있어 카탈로그 변경이 필요 없었다.

## 변경된 키 (FR-005)

이번 세션에서는 `en.json`을 재생성·커밋하지 않았으므로(research.md #9), 변경된 키 목록이 없다. `en.json`↔소스 코드 드리프트(약 530개 키, 리브랜드 문자열 77건 포함)는 별도 후속 작업으로 이연됐다 — research.md #9 참고.

## User Story 3 범위 재확정

사용자 확인(2026-07-29): 위 결과에 따라 tasks.md의 User Story 3(T017~T022, 디렉터리 단위 대규모 배치)는 대폭 축소한다. 실행이 필요한 작업은:
1. 위 `password.tsx` 사례에 대한 개별 검토·수정.
2. `enforce-id` 도입 후에도 `en.json`이 정상적으로 100% id를 유지하는지 최종 확인(별도 배치 없이 즉시 만족 가능할 것으로 예상).

tasks.md는 이 결과를 반영해 별도로 갱신한다.
