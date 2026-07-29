# 데이터 모델: i18n 추출 도구 마이그레이션

이 기능은 전통적인 애플리케이션 데이터 모델이 아니라 **i18n 카탈로그와 도구 산출물의 구조**를 다룬다. 아래 엔티티는 `spec.md`의 Key Entities를 구현 관점에서 구체화한 것이다.

## 메시지 디스크립터 (Message Descriptor)

코드 내에서 번역 대상 문자열을 선언하는 단위(`intl.formatMessage`, `defineMessage`, `localizeMessage` 호출부).

| 필드 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `id` | string | 예(강제) | 카탈로그 전역에서 유일해야 하는 명시적 식별자. `formatjs/enforce-id`가 검증. |
| `defaultMessage` | string | 예 | 영어 원문. `formatjs/enforce-default-message`가 검증. |
| `description` | string | 아니오 | 번역자를 위한 문맥 설명(선택). |
| `values` | Record<string, unknown> | 아니오 | 플레이스홀더 치환 값(`localizeMessage` 확장 대상, 연구 항목 6). |

**불변식**: 동일 `id`는 `en.json` 내에서 유일하다. `id` 없는 디스크립터는 배치 미완료 파일(아래 "마이그레이션 배치" 참고)이 아닌 한 린트 오류다.

## en.json (영어 원본 카탈로그)

- **위치**: `webapp/channels/src/i18n/en.json`
- **구조**: `{ [id: string]: { defaultMessage: string } }` — `scripts/formatter.js`가 적용된 출력 형식.
- **정렬 규칙**: 대소문자 무시 알파벳 순, 키의 `_`는 `.`보다 앞에 정렬(기존 mmjstool 순서 보존, research.md #3).
- **생성 방식**: `npm run i18n-extract`(`@formatjs/cli extract`)로 소스에서 자동 생성. 수동 편집 금지 — 수동으로 편집된 값은 다음 추출 실행 시 덮어써진다.
- **일치 검증**: `npm run i18n-extract:check`가 재추출 결과와 diff 없음을 확인(CI `check-i18n` 잡).

## ko.json (한국어 번역 카탈로그)

- **위치**: `webapp/channels/src/i18n/ko.json`
- **구조**: `en.json`과 동일한 키 집합을 따르는 번역 값 맵. 기존 스키마를 그대로 유지한다(도구 교체가 스키마 변경을 강제하지 않음).
- **관리 주체**: Weblate(외부 번역 플랫폼)가 자동 동기화하며, 필요 시 수동 보정된다. okrbest의 1급 로케일(constitution 원칙 V).
- **정합성 규칙**:
  - `en.json`에 있는 모든 키는 `ko.json`에도 존재해야 한다(값이 비어 있을 수는 있음 — 미번역 상태).
  - `en.json`에서 삭제된 키는 `ko.json`에서도 고아(orphan)로 간주되어 정리 대상이다(Weblate 빈 번역 정리 대체 스크립트, research.md #5).
  - `en.json`의 키가 마이그레이션으로 이름이 바뀐 경우, 같은 배치에서 `ko.json`도 새 키로 갱신되어야 한다(FR-005).

## 마이그레이션 배치 (Migration Batch)

기존(ID 미표시) 메시지를 `enforce-id` 대상으로 전환하는 작업 단위. Clarifications에서 결정한 하이브리드 롤아웃(FR-008)의 실행 단위다.

| 필드 | 타입 | 설명 |
|---|---|---|
| `scope` | 파일 또는 디렉터리 경로 목록 | 이 배치가 다루는 소스 범위. |
| `status` | `pending` \| `in-progress` \| `completed` | `pending`/`in-progress`: `.eslintrc.json` overrides의 예외 목록에 등재된 상태. `completed`: 예외 목록에서 제거됨. |
| `enJsonDelta` | en.json diff | 이 배치로 새로 부여된 id와 그에 대응하는 defaultMessage. |
| `koJsonDelta` | ko.json diff | 같은 배치에서 함께 반영되는 한국어 번역 갱신분(원칙 V). |

**상태 전이**: `pending → in-progress → completed`. `completed`로 전이하려면 해당 범위의 모든 메시지가 명시적 `id`를 가지고 `formatjs/enforce-id` 검사를 통과해야 한다(완료 조건).

## i18n CI 체크 잡 (`check-i18n`)

- **입력**: 소스 코드(`webapp/channels/src/**`), `en.json`, `ko.json`.
- **검증 항목**:
  1. 재추출 결과와 커밋된 `en.json`의 diff 없음(`npm run i18n-extract:check`).
  2. Weblate 빈 번역 정리 대체 검증 — 빈 문자열 번역이 방치되지 않았는지 확인(research.md #5).
  3. `formatjs/*` ESLint 규칙 통과(`npm run check`에 포함, `check-lint` 잡에서 선행 실행).
- **실패 시 산출물**: 어떤 메시지 id/파일이 불일치인지 알 수 있는 diff 로그(FR-003, Edge Case).
