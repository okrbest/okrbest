# Phase 0 연구: i18n 추출 도구 마이그레이션

## 1. `@formatjs/cli` 버전 선택

- **Decision**: `@formatjs/cli` 6.7.4를 webapp 루트 devDependency로 도입한다.
- **Rationale**: upstream 커밋(db55f9fa)이 검증한 버전이며, 이미 okrbest에 설치된 `babel-plugin-formatjs` 10.5.1·`react-intl`과의 호환성이 upstream에서 실증됐다.
- **Alternatives considered**: 구현 시점의 최신 `@formatjs/cli` — 버전 드리프트로 추출 결과(정렬·ID 보간 패턴 등)가 upstream 검증본과 달라질 위험이 있어 채택하지 않음. 필요 시 구현 단계에서 `npm outdated` 확인 후 별도 업그레이드로 분리.

## 2. `eslint-plugin-formatjs` 버전 선택

- **Decision**: upstream 실제 diff 기준 4.12.2 → 4.13.3으로 업그레이드한다.
- **Rationale**: upstream 커밋 메시지 본문은 "4.12.2 → 5.4.2"를 언급하지만, `db55f9fa^..db55f9fa` 실제 diff에서 확인된 `webapp/package.json` 변경분은 4.13.3이다. 코드 diff가 커밋 설명보다 신뢰도가 높은 근거다.
- **Alternatives considered**: 커밋 메시지의 5.4.2 채택 — 실제로 반영됐는지 diff상 확인되지 않아 보류. 구현 단계에서 npm 레지스트리 조회로 4.13.3/5.4.2 존재 여부와 breaking change를 재확인해야 한다(후속 확인 과제, 스펙 차단 요소 아님).

## 3. `en.json` 포맷 안정성

- **Decision**: upstream이 추가한 커스텀 포매터(`webapp/channels/scripts/formatter.js`)를 그대로 채택한다. 이 포매터는 `mmjstool`의 `sortJson({ignoreCase: true})`와 동일하게 대소문자 무시 정렬을 수행하고, 키의 `_`를 `.`보다 앞에 오도록 정규화해 기존 `en.json` 순서를 보존한다.
- **Rationale**: formatjs 기본 포매터를 쓰면 정렬 기준이 달라져 실제 문구 변경이 없는데도 `en.json` 전체에 걸친 대규모 diff가 발생하고, 이는 `ko.json`과의 diff 대조 및 Weblate 동기화에 불필요한 노이즈를 유발한다(Edge Case, User Story 3).
- **Alternatives considered**: formatjs 기본 simple 포매터 사용 — 정렬 노이즈로 기각.

## 4. `enforce-id` 하이브리드 롤아웃 메커니즘

- **Decision**: `webapp/channels/.eslintrc.json`의 `overrides`에 "배치 미완료 파일/디렉터리 목록"을 명시하고, 해당 목록에 대해서만 `formatjs/enforce-id`를 완화한다. 배치가 완료될 때마다 해당 경로를 목록에서 제거한다. 신규로 작성되는 파일은 이 목록에 추가할 수 없다.
- **Rationale**: Clarifications에서 결정한 하이브리드 롤아웃(신규/수정 메시지는 즉시 강제, 기존 메시지는 배치로 순차 전환, FR-002·FR-008)을 표준 ESLint 기능만으로 구현할 수 있는 방법이다. 목록이 줄어드는 방향으로만 변경되므로 진행 상황(SC-005)을 PR 리뷰에서 그대로 확인할 수 있다.
- **Alternatives considered**: 파일별 인라인 `eslint-disable` 주석 — 배치 완료 시 되돌리기 번거롭고 코드에 임시 노이즈가 남아 기각. `lint-staged`로 변경된 파일만 검사 — 아직 배치되지 않은 기존 미준수 코드를 무기한 방치할 위험이 있어 기각(목표 진행 상황을 추적할 수 없음).

## 5. Weblate 빈 번역 정리(구 `clean-empty`/`check-empty-src`) 대체

- **Decision**: upstream은 CI의 `check-i18n` 잡에서 이 검증을 완전히 제거했지만, okrbest는 이를 대체하는 경량 검증(스크립트 형태, 구현 단계에서 설계)을 유지한다.
- **Rationale**: 기존 CI 주석("Weblate가 번역 문자열을 빈 값으로 설정해도 항목 전체를 제거하지 않는 동작을 보정")이 가리키듯, 이 검증은 okrbest가 Weblate로 `ko.json`을 관리하는 한 필요한 안전장치다(constitution 원칙 V, User Story 3, SC-003). upstream이 이를 제거한 것은 upstream 자체의 번역 관리 방식 변화에 따른 것으로 보이며, okrbest에는 그대로 적용할 수 없는 차이점이다.
- **Alternatives considered**: upstream처럼 완전 제거 — `ko.json` 품질 저하(빈 번역 잔존) 리스크를 수용할 수 없어 기각. `mmjstool`을 이 기능만을 위해 유지 — 두 도구 체인이 공존하게 되어 이번 마이그레이션의 목적(도구 일원화)과 상충하므로 기각.

## 6. `localizeMessage` 리팩터링 범위

- **Decision**: 코드 조사 결과 `webapp/channels/src/utils/utils.tsx`의 `localizeMessage`는 이미 `{id, defaultMessage}` 객체 디스크립터 형태이며, 호출부 98건(테스트 제외)이 이미 명시적 `id`를 사용 중임을 확인했다. upstream이 지원을 추가한 `values` 파라미터(플레이스홀더 치환)만 격차로 남는다.
- **Rationale**: 이 마이그레이션의 실제 코드 리팩터링 범위가 upstream의 232파일 규모보다 좁을 가능성이 크다는 근거다. 정확한 미표시 ID 메시지 수(도구 교체 이후 `enforce-id` 위반 건수)는 Phase 2(tasks) 착수 시 `@formatjs/cli extract --throws`를 1회 드라이런해 정량화한다.
- **Alternatives considered**: upstream 변경분을 그대로 포팅 — 이미 호환되는 부분까지 불필요하게 재작성하게 되어 기각.

## 7. `@formatjs/cli` 설치 위치

- **Decision**: webapp 루트 `package.json`에 devDependency로 추가하고, `channels/package.json`의 `i18n-extract`/`i18n-extract:check`는 실제 추출 커맨드를 실행하는 스크립트로, 루트의 동명 스크립트는 `--workspaces --if-present`로 위임하는 패턴을 upstream과 동일하게 따른다.
- **Rationale**: 이미 `babel-plugin-formatjs`·`eslint-plugin-formatjs`가 루트에 위치한 기존 관례와 일치하며, constitution 원칙 II(의존성 중복 지양)에 부합한다.
- **Alternatives considered**: `channels`에 직접 설치 — 기존 관례와 불일치, 의존성 중복 우려로 기각.

## 구현 중 발견 사항 (T001~T012 진행 중)

### 8. npm 스크립트의 작은따옴표가 Windows(cmd.exe)에서 깨짐

- **발견**: `i18n-extract`/`i18n-extract:check` 스크립트를 upstream 그대로(작은따옴표로 glob 보호) 이식했더니, 이 Windows 개발 환경에서 `npm run i18n-extract` 실행 시 `en.json`이 빈 카탈로그(`{}`)로 생성됐다. 원인은 npm이 Windows에서 스크립트를 `cmd.exe`로 실행하는데, `cmd.exe`는 작은따옴표를 문자열 구분자로 인식하지 않아 글롭 패턴이 리터럴 문자열(따옴표 문자 포함)로 전달되어 매치되는 파일이 0개가 됐기 때문이다. `npx`로 직접 실행(Git Bash)했을 때는 정상 동작해 재현이 늦어졌다.
- **조치**: 두 스크립트의 작은따옴표를 큰따옴표로 교체했다. 큰따옴표는 `cmd.exe`와 bash 양쪽에서 모두 문자열 구분자로 인식되며, bash에서는 여전히 중괄호 확장(`{js,jsx,ts,tsx}`)을 억제한다(실측 확인).
- **영향 범위**: 이후 US2/US3에서 추가하는 npm 스크립트(예: `check-empty-translations` 관련)도 동일하게 큰따옴표를 사용해야 한다.

### 9. `en.json`이 소스 코드의 `defaultMessage`와 상당히 어긋나 있음 (기존 카탈로그 정체)

- **발견**: 수정된 스크립트로 `en.json`을 재생성해 기존 파일과 비교한 결과, 약 6,858개 키 중 530여 개(≈8%)의 문구가 실제로 다르다. 이 중 약 77개는 리브랜드 문자열로, 소스 코드의 `defaultMessage`는 이미 "OKR.BEST"인데 커밋된 `en.json`은 여전히 "Mattermost"다(예: `about.copyright`, `about.notice`, `about.version`). 나머지는 리브랜드와 무관한 문구 개선(오타 수정, 도움말 텍스트 갱신 등)으로, 과거 upstream 반영 시점에 `en.json` 재추출이 누락되어 누적된 것으로 보인다.
- **의미**: 이는 도구 교체(`mmjstool` → `@formatjs/cli`) 자체의 버그가 아니라 기존에 이미 존재하던 카탈로그 정체 문제다. 런타임에 카탈로그가 `defaultMessage`보다 우선 적용되므로, 영어 로케일 사용자가 실제로 "Mattermost" 문구를 보고 있을 가능성이 있다.
- **결정**: 이번 세션(MVP: Setup+Foundational+US1)에서는 `en.json`을 재생성·커밋하지 않는다(사용자 확인). 이 드리프트의 해소(특히 리브랜드 77건)는 User Story 3 배치 작업 범위에 포함해 후속 세션에서 다룬다 — `batches.md`(T007)에 별도 항목으로 기록 필요.
- **Alternatives considered**: 지금 전체 530건을 en.json에 반영 — ko.json 번역 정합성에 미치는 영향이 이번 세션 범위(MVP)를 크게 벗어나 기각. 리브랜드 77건만 즉시 반영 — 사용자가 US3로 이연하기로 결정.

## 구현 중 발견 사항 (T013~T016, User Story 2)

### 10. `ko.json`에 en.json 기준 고아 키 159개 존재 — 확인 후 삭제 (⚠️ 후속 세션에서 검증 스크립트 버그 발견, 26건 복구)

- **발견**: T014의 빈 번역/고아 키 검출 스크립트를 실제 카탈로그에 실행한 결과 `ko.json`에 `en.json`에는 없는 키가 159개 있었다(빈 문자열 번역은 0건).
- **조치(원래)**: 159개 키 전부를 `webapp/channels/src` 전체에서 리터럴 문자열로 검색해 소스 코드 어디에서도 참조되지 않음을 확인한 뒤(사용자 지시) 제거했다.
- **버그 발견(후속 세션)**: 이 "참조 확인" 검증에 쓴 `sed` 이스케이프 명령(`s/[.[\*^$]/\\&/g`)이 실제로는 `.`을 이스케이프하지 못하고 리터럴 `&`로 치환해버려, 점(`.`)을 포함한 사실상 모든 id에 대해 검색 패턴이 깨져 있었다 — 즉 "확인" 단계가 항상 "미사용"으로 판정하는 무의미한 검사였다. `grep -F`(고정 문자열, 이스케이프 불필요)로 159개를 재검증한 결과 **26개가 실제로는 소스에서 여전히 사용 중**이었다(우연히 132개는 정말 미사용이라 결과가 맞았을 뿐). `grep -F`가 부분 문자열도 매치하므로 27번째 후보(`admin.license.enterpriseEdition`)는 `admin.license.enterpriseEdition.add.seats`의 부분 매치였음을 정확한 경계 매치로 재확인해 제외했다.
- **조치(수정)**: 26개 키의 원래 한국어 번역을 삭제 커밋(`fef1a48a4e`)에서 복구해 `ko.json`에 재추가했다. 이 26개는 `en.json`에도 없었으므로(소스에는 있지만 한 번도 추출되지 않은 신규 메시지) `en.json`에도 함께 추가했다. 그중 `widget.passwordInput.hidePassword`/`showPassword` 2건은 `id`와 `defaultMessage`가 모두 삼항 연산자로 계산되는 별도의 동적 id 버그였음이 추가로 드러나 함께 수정했다(batches.md의 동적 id 사각지대 패턴과 동일).
- **영향/교훈**: 대량 삭제 전 "사용 여부 확인" 스크립트는 그 자체로 반드시 사전 검증해야 한다(예: 알려진-사용중 키 하나로 스모크 테스트) — 셸 이스케이핑은 특히 취약하다. `grep -F`(고정 문자열)가 정규식 이스케이핑보다 이런 용도에 근본적으로 더 안전하다.

### 11. `i18n-extract:check`의 `--throws`가 중복 id 35건 때문에 항상 실패함

- **발견**: T016(quickstart 시나리오 2 재현) 도중 `npm run i18n-extract:check`가 항상 `Duplicate message id` 오류로 죽는 것을 발견했다. `--throws`는 "id 없음"이 아니라 **첫 번째로 만나는 임의의 경고**를 치명적 오류로 바꾸는 옵션이며(T007에서 이미 확인한 것과 동일한 특성), okrbest 코드베이스에는 서로 다른 `defaultMessage`로 같은 id를 재사용하는 경우가 35건 있어 diff 비교 로직에 도달하기도 전에 항상 실패했다.
- **조치**: `--throws`를 제거했다. 추출은 경고를 stderr에 남기되 완료되며, 이후 `diff` 비교가 실제 검증을 수행한다. 이는 upstream 스크립트를 그대로 이식하며 발견한 설계 결함을 이 저장소에 맞게 수정한 것으로, en.json/ko.json 데이터 자체를 바꾸는 정책적 결정이 아니라 스크립트 로직 수정이다.
- **의미**: 이 수정 이후에도 `i18n-extract:check`는 연구 항목 #9(en.json↔소스 드리프트)로 인해 여전히 실패한다 — 이는 새 문제가 아니라 이미 이연하기로 확정된 사전 이슈의 자연스러운 결과다. 35건의 중복 id 자체를 해소하는 것은 별도 후속 작업이다(어떤 defaultMessage가 정답인지 제품 판단이 필요해 기계적으로 처리할 수 없음).

## 구현 중 발견 사항 (T022, Polish — 전체 게이트 실행)

### 12. formatjs 규칙 9종을 upstream과 동일하게 error로 켰더니 `enforce-placeholders` 134건·`enforce-default-message` 7건이 걸림

- **발견**: T010에서 upstream 설정 그대로 9개 규칙을 추가했을 때는 `enforce-id`(목표 규칙)만 검증했고 나머지 8개 규칙의 실제 위반 건수는 확인하지 않았다. T022에서 `npm run check` 상당 작업을 처음 전체 실행하며, `enforce-placeholders`(ICU 플레이스홀더와 `values` 불일치) 134건, `enforce-default-message`(defaultMessage 누락) 7건이 error 레벨로 걸려 게이트가 막힌다는 것을 발견했다.
- **조치**: `enforce-default-message` 7건 중 정적 id + en.json에 이미 존재하는 값이 명확한 2개 파일(`access_problem/index.tsx`, `cloud_invoice_preview/index.tsx`)은 en.json의 기존 값을 그대로 사용해 `defaultMessage`를 추가해 즉시 해결했다. 나머지 4건(동적 id 참조·pass-through prop 패턴·테스트 픽스처)과 `enforce-placeholders` 134건 전체는 사용자 확인에 따라 규칙을 `error`(2)에서 `warning`(1)으로 낮추고 후속 작업으로 이연했다 — 파일마다 실제 버그인지 규칙의 오탐(간접적으로 조합되는 값을 규칙이 못 보는 경우)인지 개별 판단이 필요해 이번 세션(Polish) 범위를 벗어난다.
- **의미**: `formatjs/enforce-id`(이 마이그레이션의 핵심 목표)는 계속 error로 유지되며 영향받지 않는다. `no-invalid-icu`는 위반 0건이라 error 유지. `no-multiple-whitespaces`는 이번 마이그레이션 이전부터 이미 error였고 위반 2건은 사전 존재 이슈로 그대로 둔다(우리가 만든 문제가 아님).
- **Alternatives considered**: upstream과 동일하게 전부 error 유지 — 134+7건이 즉시 `npm run check`를 막아 이 브랜치의 다른 모든 개선사항까지 머지를 막게 되므로 기각(사용자 판단).

## 구현 중 발견 사항 (후속 세션 — en.json 드리프트 해소, 연구 항목 #9 이어서)

### 13. "only in en.json" 20개 키 중 12개는 추출 사각지대, 8개는 진짜 죽은 키

- **발견**: 연구 항목 #9의 드리프트를 실제로 해소하려고 재추출본과 커밋된 `en.json`을 비교하니, `en.json`에만 있고 신선한 추출 결과에는 없는 키가 20개 있었다. 처음엔 전부 "미사용"으로 보였으나, 항목 #10에서 배운 교훈(고정 문자열 `grep -F`로 재검증)을 그대로 적용해 하나씩 확인한 결과 12개는 실제로 프로덕션 코드에서 여전히 쓰이고 있었고, `@formatjs/cli`가 정적으로 추출하지 못하는 4가지 서로 다른 패턴 때문에 빠진 것이었다:
  - `login.tsx`의 `t('login.no...')` 7건 — upstream의 `t(id: string): string` 마커 함수 관행(런타임 id를 동적으로 계산하되 추출 시점엔 리터럴로 인식시키는 용도)인데, `@formatjs/cli`는 객체 디스크립터만 인식하고 이 "bare string" 마커는 `--additional-function-names`에 넣어도 인식하지 않는다. `defineMessages` 객체 + 문자열 키 조합으로 리팩터링해 해결.
  - `org_role_management.tsx`의 `admin.org_roles.panel_title`/`panel_subtitle` 2건 — `AdminPanel`의 `title`/`subtitle` prop이 `MessageDescriptor` 타입인데 `defineMessage()`로 감싸지 않고 bare object literal(`{id, defaultMessage}`)을 그대로 넘겨서 정적 분석이 추출 지점으로 인식하지 못함. `defineMessage()`로 감싸 해결.
  - `marketplace_item_plugin.tsx`의 `.message.intro`/`.message.current` 2건 — `defaultMessage`에 ICU 플레이스홀더 대신 JS 템플릿 리터럴(`` `...${name}...` ``)을 써서 이미 완성된 문자열을 넣고 있었다(옆에 있는 `values` prop은 사실상 죽은 코드였다). ICU 플레이스홀더(`{name}`)로 바꿔 해결 — 형제 케이스 `current_with_release_notes`와 동일한 패턴으로 통일.
  - `notification_actions.tsx`의 `notification.crt` 1건 — `Utils.localizeAndFormatMessage()` 래퍼(내부적으로 `localizeMessage` 호출)를 쓰는데 `--additional-function-names`엔 `localizeMessage`만 등록돼 있었음. 코드베이스 전체에서 이 래퍼 사용처는 3곳뿐이고 그중 리터럴 `id`를 쓰는 건 이 1곳뿐이라(`app_command_parser_dependencies.ts`는 변수를 넘겨 애초에 정적 추출 불가) `--additional-function-names`에 `localizeAndFormatMessage` 추가로 해결.
  - 나머지 8개(`channel_header.viewMembers`, `setting_picture.help.profile.example`, `sidebarLeft.browserOrCreateChannelMenu.{createUserGroupMenuItem,openDirectMessageMenuItem}.primaryLabel`, `someting.string`, `test.description`, `test1`, `test2`)는 `grep -F`로 전체 `src` 재확인 결과 프로덕션 코드 어디에도 없었다 — 6개는 `.test.tsx` 픽스처(추출 glob이 테스트 파일을 제외하므로 애초에 추출 대상이 아님)에서만 리터럴로 등장했고, `sidebarLeft.*` 2개는 테스트 파일에조차 없는 완전한 사문(死文)이었다. `en.json`/`ko.json`에서 제거.
- **의미**: `@formatjs/cli`의 정적 추출은 "JSX의 `id=` 리터럴 속성" 또는 "`defineMessage(s)`/등록된 마커 함수의 객체 인자"만 인식하며, 그 외의 모든 간접 경로(bare object prop, 템플릿 리터럴 defaultMessage, 미등록 wrapper 함수, 문자열 전용 마커)는 조용히 스킵한다 — 에러도 경고도 없다. 이는 `enforce-id`(항목 #12)가 잡아내지 못하는 사각지대와 근본적으로 같은 종류의 문제로, "구조적으로 `id` prop이 있는가"만 보고 "그 값이 정적 리터럴인가"는 보지 않는다.
- **Alternatives considered**: 20개를 en.json에서 일괄 유지(추출 결과 무시) — `i18n-extract:check`가 영원히 실패하게 되어 기각.

### 14. `en.json` 484개 값 드리프트는 실제 upstream 문구 개선 + 리브랜드 누락이었음 — 재추출로 기계적 해소

- **발견**: 항목 #13 해소 후 재추출하니 `en.json`과 완전히 동일한 키 집합에 대해 484개 값이 실제로 달랐다(연구 항목 #9의 "약 530여 개" 추정치와 합치). 표본 확인 결과 전부 다음 두 범주였다: (1) 항목 #9에서 이미 파악한 리브랜드 누락(`about.*` 등, "Mattermost" → "OKR.BEST"), (2) upstream이 그동안 문구를 개선한 것(오타 수정, 용량 단위 변경, 더 명확한 도움말 문구 등) — id 자체가 바뀐 경우는 없었다(해시 기반 id 사용처가 없어 id 안정성 문제는 없음).
- **조치**: `en.json`이 "소스 코드에서 기계적으로 생성되는 파일"이라는 이 마이그레이션의 설계 원칙에 따라, 개별 문구를 수동으로 판단하지 않고 `npm run i18n-extract`를 그대로 실행해 덮어썼다. 이 과정에서 소스에는 있었지만 `en.json`에 없던 신규 키 5개(`advanced_create_post.doNotDisturbWarning` 등, okrbest 자체 기능)도 함께 추출돼 `ko.json`에 번역을 새로 추가했다.
- **의미**: `npm run i18n-extract:check`가 이제 클린 상태에서 통과한다(`diff` 결과 없음). 이 리팩터링 과정에서 `ko.json`을 en.json의 새 영어 문구에 맞춰 재번역하지는 않았다 — 번역 키(`id`)만 일치하면 되고 문구 자체의 의미 동기화는 훨씬 큰 별도 콘텐츠 작업이라 범위 밖이다.
- **부수 발견(범위 밖, 후속 과제로 기록)**: 이 검증 과정에서 `en.json`에는 있지만 `ko.json`에는 아예 없는 키가 213개 있다는 것을 추가로 발견했다(`burn_on_read.*`, `agent.*`, `admin.access_control.*`, `admin.site.localization.auto_translation.*` 등 — 전부 이번 세션 이전부터 upstream 반영으로 이미 존재하던 신규 기능들). 이는 오늘 작업으로 생긴 문제가 아니라 이전부터 누적된 미번역 백로그이며, `check-empty-translations.js`는 "빈 값"과 "고아 키"만 검사하고 "누락된 키"는 검사하지 않아 지금까지 드러나지 않았다. 실제 한국어 번역이 필요한 콘텐츠 작업이라 이번 드리프트-리싱크 브랜치 범위에서 제외하고 별도 후속 작업으로 남긴다.
- **Alternatives considered**: 484건을 손으로 하나씩 검토해 "진짜 의도적 변경"과 "실수"를 구분 — en.json이 소스의 파생 산출물이라는 설계상 그 구분 자체가 무의미하므로(소스가 정답) 기각.

## 구현 중 발견 사항 (후속 세션 — 연구 항목 #12 이연분 해소: enforce-placeholders 134건 + enforce-default-message 3건)

### 15. `enforce-placeholders` 위반의 절반 이상(71/134)이 admin 설정 스키마 프레임워크의 out-of-band 값 공급 패턴 때문

- **발견**: `admin_definition.tsx`(63건)와 `admin_definition_ldap_wizard.tsx`(8건)의 위반을 하나씩 확인한 결과, 전부 `help_text`/`label`/`placeholder`/`error_message` 같은 `AdminDefinitionSetting` 필드가 `defineMessage({id, defaultMessage})`로만 선언되고, ICU 플레이스홀더 값은 (a) `help_text_values`/`label_values`/`placeholder_values` 같은 형제(sibling) 프로퍼티를 `schema_admin_settings.tsx`의 `SchemaText`가 나중에 읽어서 공급하거나, (b) `error_message`의 `{error}`는 `RequestButton` 컴포넌트가 자신의 `render()`에서 항상 고정으로 주입하는 방식이었다. `formatjs/enforce-placeholders`는 `values`가 메시지와 같은 호출/JSX 안에 나란히 있는 경우만 인식하므로 이 두 프레임워크 관례를 전혀 볼 수 없었다.
- **조치**: 두 파일 모두 실제 렌더 지점(`schema_admin_settings.tsx`의 `helpTextValues = setting.help_text_values`, `request_button.tsx`의 `values={{error: this.state.fail}}`)에서 값이 정말로 연결되는지 확인한 뒤 `.eslintrc.json` overrides로 `formatjs/enforce-placeholders`를 이 두 파일에서만 껐다.
- **의미**: 같은 out-of-band 공급 패턴이 이후 조사에서 admin 스키마 파일 밖에서도 계속 발견됐다(항목 #16 참고) — 특정 파일 하나의 문제가 아니라 이 코드베이스 전반에 반복되는 관용구였다.

### 16. 나머지 63건 + enforce-default-message 3건은 "진짜 버그"와 "같은 out-of-band 오탐"이 섞여 있었음 — 전수 개별 확인

- **발견**: 나머지 위반들을 렌더 지점까지 추적해보니 두 그룹으로 갈렸다.
  - **진짜 버그 (8곳)**: `channel_intro_message.tsx`(메시지에 없는 `name` 값이 죽은 채로 남아있던 4곳), `sidebar_category_{sorting,generic}_menu.tsx`(`values`엔 `{name}`을 넘기면서 `defaultMessage`엔 플레이스홀더가 없었음 — `ko.json` 등 대부분의 기존 번역은 이미 `{name}`을 포함하고 있어 영어 원문 쪽이 뒤처진 것으로 확인), `confirm_integration.tsx`(봇 생성 메시지가 `<b>`/`<link>` 렌더러가 이미 `values`에 준비돼 있는데도 `defaultMessage`에 마크다운 문법(`**bold**`, `[text](url)`)을 써서 사용자에게 마크다운이 그대로 노출됨), `permission_row.tsx`(`{...permissionRolesStrings[id].description}`를 스프레드해야 하는데 `.description.id`만 꺼내 써서 `defaultMessage`가 통째로 누락 — 바로 위 `name` 필드는 올바르게 스프레드하고 있어 대조군 역할), `email_to_oauth.tsx`(MFA 진입 경로의 `formatMessage` 호출에 `values` 인자 자체가 빠져 있었음 — 몇 줄 아래 동일 메시지의 non-MFA 경로엔 있어 대조 가능), 그 외 `team_warning_banner.tsx`/`channel_view.tsx`/`mfa/setup.tsx`/`error_boundary.tsx`/`forward_post_modal`/`custom_profile_attributes.tsx`/`deactivate_member_modal.tsx`의 복사-붙여넣기로 남은 죽은 값들, `suggestion_list.tsx`의 완전히 죽은 `renderDivider` 메서드(코드베이스 전체에서 호출하는 곳이 없고 가리키는 `suggestion.default` id도 `en.json`에 없었음 — 삭제).
  - **오탐 (약 20개 파일)**: 항목 #15와 동일한 계열의 out-of-band 공급이 세 가지 변형으로 반복됐다 — (i) 여러 분기에 걸쳐 조립된 `values` 변수를 나중에 별도 위치에서 `formatMessage`/렌더에 적용(`useWords.tsx`, `prewritten_chips.tsx`, `add_users_to_group_modal.tsx`의 `useMemo` 변수, `localization/auto_translation.tsx`), (ii) `values`를 descriptor 객체 안에 프로퍼티로 내장해두고 나중에 `{...descriptor}` 스프레드로 되살리는 이 코드베이스의 자체 관용구(`invite_actions.ts`·`lhs_nearing_limit_modal.tsx`·`useShowAdminLimitReached.ts`가 함께 쓰는 `utils/i18n.tsx`의 `Message` 타입 + `messageToElement`, `integration_utils.ts`의 `DialogError` 타입 + `interactive_dialog.tsx`, `feature_discovery/features/auto_translation.tsx`의 `FeatureDiscovery`), (iii) 공용 훅/컴포넌트가 값을 대신 주입(`thread_popout.tsx`·`rhs_plugin_popout.tsx`의 `usePopoutTitle`, `group_settings.tsx`의 `AdminPanel` `subtitleValues`, `permission_schemes_settings.tsx`의 `teamOverrideUnavalableView`, `bots.tsx`/`installed_commands.tsx`/`installed_incoming_webhooks.tsx`/`installed_oauth_apps.tsx`/`installed_outgoing_webhooks.tsx`/`installed_outgoing_oauth_connections.tsx`가 공유하는 `backstage_list.tsx`의 `React.cloneElement(..., {values: {...values, searchTerm}})`).
  - `enforce-default-message` 3건 중 2건(`permission_row.tsx`, 위 실제 버그)은 수정으로 해소됐고, 나머지 1건(`loading_spinner.test.tsx`)은 `defaultMessage` 없이 모킹된 카탈로그 폴백을 의도적으로 테스트하는 코드라 인라인 `eslint-disable-next-line`으로 처리했다.
- **조치**: 오탐으로 확인된 각 파일은 `.eslintrc.json`의 기존 override 배열에 추가(파일 목록이 항목 #15의 2개에서 총 24개로 늘어남). 진짜 버그는 전부 직접 수정.
- **의미**: 위반 137건(134+3) 전부 해소 후 재확인해 0건임을 확인하고 `formatjs/enforce-placeholders`·`formatjs/enforce-default-message`를 `warning`(1)에서 `error`(2)로 재승격했다 — 항목 #12에서 이연했던 작업이 완전히 마무리됨.
- **Alternatives considered**: 오탐 20여 개 파일 각각에 파일 단위 override 대신 위반 라인마다 `eslint-disable-next-line` 인라인 주석을 다는 방안 — 같은 프레임워크 관용구가 파일 전체에 반복되는 경우(예: `admin_definition.tsx`의 63건)엔 override 한 줄이 인라인 주석 수십 개보다 명확하고 유지보수하기 쉬워 override를 선택했다. 다만 위반이 파일 전체가 아니라 한 곳뿐인 `loading_spinner.test.tsx`는 인라인 주석이 더 정밀해 그렇게 처리했다.

## 구현 중 발견 사항 (후속 세션 — 연구 항목 #14 부수 발견 해소: 미번역 키 213개)

### 17. `en.json`에만 있고 `ko.json`엔 없던 213개 키를 전부 번역해 추가, 겸사겸사 정렬 붕괴도 복구

- **발견**: 항목 #14에서 범위 밖으로 남겨뒀던 213개 미번역 키(`burn_on_read.*` 18건, `admin.*` 62건, `channel_settings.*` 17건, `post.*`/`property_card.*`/`texteditor.rewrite.*` 각 15건, `keep_remove_flag_content_modal.*` 12건, `interactive_dialog.*` 10건 등)를 사용자 확인 후 일괄 번역했다. 삽입 후 전체 정렬 검증(`formatter.js`의 `compareMessages` 기준)을 돌려보니 213건과 무관하게 파일 앞부분에서 221곳의 순서 위반이 발견됐다 — 원인은 이전 세션의 스택 브랜치 rebase 충돌 해결(연구 항목 #15/#16 이전, PR 머지 작업 중) 때 두 브랜치의 삽입분을 정렬 위치 재계산 없이 단순 이어붙이기만 했기 때문.
- **조치**: 213개 키를 기존 `ko.json` 번역 스타일(격식체, "매직 링크"/"액세스 제어" 등 기존 확립된 용어 재사용)에 맞춰 번역해 정확한 정렬 위치에 삽입한 뒤, 이 김에 `ko.json` 전체를 `compareMessages` 기준으로 재정렬해 정렬 붕괴도 함께 복구했다(diff가 966+/753-로 커진 이유 — 재정렬 자체의 부작용이며 내용 변경은 213건뿐).
- **의미**: `en.json`/`ko.json` 키 집합이 이제 완전히 일치(6898/6898), `check-empty-translations.js` 클린 통과. 이 브랜치도 이전과 마찬가지로 `ko.json`을 직접 수정하므로 "Only PRs from weblate should modify non-English translation files" CI 게이트에는 걸리지만(연구 항목에는 없으나 PR 머지 로그에 기록된 이 저장소의 정책), branch protection이 없어 머지를 막지는 않으며 사용자가 이미 이 트레이드오프를 확인하고 진행을 지시했다.
- **Alternatives considered**: 정렬 복구를 이번 커밋에서 분리해 별도 PR로 — 어차피 같은 파일을 큰 폭으로 건드리는 시점이라 diff를 두 번 나누는 것보다 한 번에 정리하는 편이 리뷰 부담이 적다고 판단해 기각.
