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
