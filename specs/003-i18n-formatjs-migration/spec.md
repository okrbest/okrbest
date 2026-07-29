# Feature Specification: i18n 추출 도구 마이그레이션 (mmjstool → @formatjs/cli)

**Feature Branch**: `003-i18n-formatjs-migration`

**Created**: 2026-07-29

**Status**: Draft

**Input**: User description: "upstream 커밋 db55f9fa (MM-66653: migrate i18n extraction from mmjstool to @formatjs/cli, #34498)를 okrbest에 맞춰 별도 spec으로 진행. 232개 파일, +1215/-1542 라인 규모의 도구 체인 교체이며 CI(.github/workflows/webapp-ci.yml)와 en.json 재구성을 포함해 speckit-sync 스킬에 의해 spec 전환 대상으로 분류됨."

## Clarifications

### Session 2026-07-29

- Q: 기존 코드 전체에 ID를 부여하고 `en.json`을 재구성하는 작업을 한 번에 끝낼지, 나눠서 진행할지? → A: 하이브리드 — `enforce-id`는 즉시 error로 전체 적용해 신규 미준수 코드 유입을 차단하되, 기존 메시지 ID 부여와 `en.json` 재포맷은 파일/디렉터리 단위의 여러 작은 PR로 나누어 순차 진행한다.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 개발자가 새 i18n 메시지에 명시적 ID를 부여받는다 (Priority: P1)

프론트엔드 개발자가 UI에 새로운 문구를 추가할 때, 추출 도구가 해당 메시지에 명시적 ID가 있는지 개발 단계(린트)에서 즉시 검증해 주어, 이후 번역 추출·배포 단계에서 ID 누락으로 인한 문제가 발생하지 않는다.

**Why this priority**: ID 강제 규칙이 이 마이그레이션의 핵심 목적이며, 이후 모든 번역 워크플로(en.json 추출, ko.json 매핑)가 이 규칙 위에서 동작한다. 이 규칙 없이는 마이그레이션의 나머지 부분이 의미가 없다.

**Independent Test**: 명시적 ID 없이 `intl.formatMessage` 또는 `localizeMessage`를 호출하는 코드를 추가하고, 린트를 실행했을 때 오류로 검출되는지 확인하는 것으로 독립적으로 검증 가능하다.

**Acceptance Scenarios**:

1. **Given** 개발자가 `id`, `defaultMessage`를 모두 포함한 메시지를 코드에 추가한 상태, **When** 린트를 실행하면, **Then** 오류 없이 통과한다.
2. **Given** 개발자가 `id` 없이 `defaultMessage`만 있는 메시지를 코드에 추가한 상태, **When** 린트를 실행하면, **Then** `enforce-id` 규칙 위반으로 오류가 표시된다.

---

### User Story 2 - CI가 새 도구 체인으로 i18n 정합성을 검증한다 (Priority: P2)

CI 파이프라인이 mmjstool 대신 @formatjs/cli로 메시지를 추출하고, 추출 결과와 저장소에 커밋된 `en.json`을 비교해 불일치가 있으면 빌드를 실패시켜, 커밋되지 않은 메시지 누락을 병합 전에 차단한다.

**Why this priority**: 도구 자체는 로컬 개발 경험(P1)만으로는 강제되지 않으며, CI 검증이 있어야 팀 전체에 규칙이 실질적으로 적용된다. P1 다음으로 마이그레이션의 실효성을 좌우한다.

**Independent Test**: `en.json`에 반영되지 않은 메시지를 추가한 브랜치를 CI에 태워, `check-i18n` 잡이 실패하는지 확인하는 것으로 독립적으로 검증 가능하다.

**Acceptance Scenarios**:

1. **Given** 코드의 모든 메시지가 `en.json`과 일치하는 상태, **When** CI의 i18n 체크 잡이 실행되면, **Then** 성공한다.
2. **Given** 코드에 새 메시지가 추가되었지만 `en.json`에는 반영되지 않은 상태, **When** CI의 i18n 체크 잡이 실행되면, **Then** diff 불일치로 실패하고 어떤 메시지가 누락되었는지 알 수 있는 정보를 출력한다.

---

### User Story 3 - 번역 관리자가 기존 ko.json 번역 워크플로를 그대로 유지한다 (Priority: P3)

okrbest의 한국어 번역 관리자가 Weblate 기반으로 유지해 온 `ko.json`이, 도구 교체 이후에도 `en.json`의 키 구조와 계속 매핑되어 번역 누락이나 깨짐 없이 동작한다.

**Why this priority**: 도구 교체 자체는 개발 워크플로 개선이 목적이지만, 부수 효과로 번역 자산이 깨지면 사용자에게 직접적인 피해(오역/미번역 노출)가 발생한다. P1·P2가 안정화된 뒤 마지막으로 검증해도 되는 항목이다.

**Independent Test**: 마이그레이션 전후로 `en.json`과 `ko.json`의 키 집합을 비교해, 마이그레이션으로 인해 새로 누락되거나 깨진 키가 없는지 확인하는 것으로 독립적으로 검증 가능하다.

**Acceptance Scenarios**:

1. **Given** 마이그레이션 이전에 번역되어 있던 `ko.json`의 키, **When** 마이그레이션이 완료되면, **Then** 동일한 키에 대해 기존 한국어 번역이 그대로 유지된다.
2. **Given** 마이그레이션 과정에서 `en.json`의 일부 키 이름이나 구조가 바뀐 경우, **When** 해당 변경이 감지되면, **Then** 대응하는 `ko.json` 번역이 함께 갱신되어 미번역 문구가 사용자에게 노출되지 않는다.

---

### Edge Cases

- 기존 코드베이스에 이미 존재하지만 명시적 ID가 없는 메시지는 파일/디렉터리 단위의 여러 작은 배치 PR로 나누어 순차적으로 ID를 부여한다(단일 대규모 변경 금지). 배치가 모두 완료되기 전까지는 `enforce-id`가 아직 처리되지 않은 기존 메시지에는 적용되지 않고, 신규/수정 메시지에만 즉시 적용된다.
- `en.json` 재구성으로 인한 순수 포맷 diff는 upstream 커스텀 포매터(`scripts/formatter.js`, research.md #3)를 채택해 애초에 발생하지 않도록 방지한다. 배치 진행 중 발생하는 실제 diff는 id 부여로 인한 신규/변경 키뿐이므로 별도의 구분 로직은 필요하지 않다.
- 플러그인(외부 확장) SDK를 통한 자체 i18n 등록은 이번 마이그레이션 범위에서 다루지 않는다(Assumptions 참고). 새 추출 도구의 플러그인 인식 여부 확인은 필요 시 후속 작업으로 분리한다.
- CI에서 i18n 체크가 실패했을 때 개발자는 로컬에서 `npm run i18n-extract:check`(FR-007, contracts/i18n-tooling-contract.md)를 실행해 동일한 실패를 재현하고 수정할 수 있다.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: 시스템은 webapp 소스에서 i18n 메시지를 추출할 때 커스텀 `mmjstool` 대신 `@formatjs/cli`를 사용해야 한다.
- **FR-002**: 개발자가 신규로 추가하거나 수정하는 모든 i18n 메시지는 명시적 `id`를 가져야 하며, `id`가 없는 메시지는 린트 단계에서 즉시 오류로 검출되어야 한다. 아직 배치 마이그레이션이 완료되지 않은 기존 메시지는 해당 배치가 완료되기 전까지 이 검출 대상에서 한시적으로 제외될 수 있다.
- **FR-003**: CI는 추출된 메시지와 저장소에 커밋된 `en.json`을 비교해 차이가 있으면 빌드를 실패시켜야 하며, 이때 기존 `mmjstool` 기반 검증 로직에 대한 의존을 제거해야 한다.
- **FR-004**: 마이그레이션 완료 시점 기준으로 `ko.json`에 존재하던 모든 번역 키와 값은 대응하는 `en.json` 키가 유지되는 한 그대로 보존되어야 한다.
- **FR-005**: `en.json`의 키 구조나 이름이 마이그레이션으로 인해 변경되는 경우, 해당 변경 목록이 식별 가능해야 하며 `ko.json` 번역 담당자가 후속 조치를 할 수 있어야 한다.
- **FR-006**: 빌드 도구 설정(`package.json` 스크립트, ESLint 설정)은 okrbest 저장소 구조(webapp 루트 워크스페이스와 `webapp/channels` 하위 워크스페이스)에 맞게 조정되어야 한다.
- **FR-007**: 마이그레이션 이후에도 개발자는 로컬에서 i18n 추출과 검증을 CI와 동일한 방식으로 실행할 수 있어야 한다.
- **FR-008**: 기존 메시지에 대한 ID 일괄 부여와 `en.json` 재구성은 단일 대규모 변경이 아니라 파일 또는 디렉터리 단위로 범위가 제한된 여러 개의 배치로 나누어 순차 진행해야 하며, 각 배치는 독립적으로 검토·병합 가능해야 한다.

### Key Entities

- **i18n 메시지(Message Descriptor)**: 코드 내에서 `id`, `defaultMessage`, `description`으로 구성되는 번역 대상 문자열 단위.
- **en.json**: 추출 도구가 생성하는 영어 원본 메시지 카탈로그. 모든 메시지 ID와 기본값을 담는 단일 소스.
- **ko.json**: okrbest가 Weblate 기반으로 자체 유지하는 한국어 번역 카탈로그. `en.json`의 키 구조를 따라간다.
- **i18n CI 체크 잡**: `.github/workflows/webapp-ci.yml`에서 추출 결과와 커밋된 카탈로그의 일치 여부를 검증하는 작업.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 마이그레이션 완료 후 신규로 추가되는 i18n 메시지의 100%가 명시적 ID를 가지며, ID 누락 시 린트에서 100% 검출된다.
- **SC-002**: CI의 i18n 체크 잡이 `mmjstool` 의존성 없이 통과하며, 통과/실패 여부만으로 메시지 카탈로그 최신성을 판단할 수 있다.
- **SC-003**: 마이그레이션 전후 `ko.json`의 기존 번역 커버리지(번역된 키 비율)가 마이그레이션으로 인해 저하되지 않는다(0건의 회귀).
- **SC-004**: 개발자가 새 메시지를 추가한 뒤 로컬에서 추출 명령을 실행해 `en.json` 갱신을 확인하기까지 걸리는 시간이 기존 대비 동등하거나 단축된다.
- **SC-005**: 기존 메시지에 대한 ID 부여 배치 작업이 모두 완료된 시점에는 `en.json`에 포함된 전체 메시지의 100%가 명시적 ID를 가지며, 이 시점까지 배치별 진행 상황(완료된 파일/디렉터리 비율)을 추적할 수 있다.

## Assumptions

- `webapp/channels`가 okrbest의 주 프론트엔드 워크스페이스이며, 이번 마이그레이션의 i18n 추출 대상 범위이다. 별도의 모바일 앱 저장소(mattermost-mobile 등)는 이 저장소에 포함되어 있지 않으므로 범위에서 제외한다.
- `@formatjs/cli`, `eslint-plugin-formatjs` 등 도구 버전은 upstream 실제 diff 검증 기준(`@formatjs/cli` 6.7.4, `eslint-plugin-formatjs` 4.13.3 — research.md #2)을 출발점으로 삼되, okrbest의 기존 의존성 트리와 충돌 시 조정 가능하다.
- 이번 마이그레이션은 번역 내용(문구 자체의 의미) 변경을 목적으로 하지 않으며, 도구 체인 교체와 그에 따른 카탈로그 구조 정합성 확보에 한정한다.
- 플러그인 SDK를 통한 외부 확장의 i18n 등록 방식은 이번 마이그레이션 범위에서 다루지 않으며, 별도 확인이 필요하면 후속 작업으로 분리한다.
