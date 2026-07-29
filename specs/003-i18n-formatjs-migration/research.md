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
