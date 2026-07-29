# 도구 인터페이스 계약: i18n 추출/검증

이 기능은 외부 API를 노출하지 않는다. 대신 개발자와 CI가 의존하는 **npm 스크립트 인터페이스**와 **ESLint 규칙 계약**이 이 기능의 "계약"에 해당한다. 이 문서는 그 입력/출력/성공-실패 기준을 고정한다.

## 1. npm 스크립트 계약

### `npm run i18n-extract` (webapp 루트 및 `channels` 워크스페이스)

- **입력**: `webapp/channels/src/**/*.{js,jsx,ts,tsx}` (`*.d.ts`, `*.test.*` 제외)
- **동작**: `@formatjs/cli extract`로 메시지 디스크립터를 추출해 `scripts/formatter.js` 포맷으로 `src/i18n/en.json`을 갱신한다.
- **출력**: 갱신된 `en.json` (파일 시스템에 직접 기록).
- **종료 코드**: 추출 자체는 문법 오류가 없는 한 항상 0.
- **사용 맥락**: 개발자가 로컬에서 새 메시지를 추가한 뒤 `en.json`을 갱신할 때 실행(User Story 1, 2 로컬 재현).

### `npm run i18n-extract:check` (webapp 루트 및 `channels` 워크스페이스)

- **입력**: 현재 커밋된 `src/i18n/en.json`과 위 추출 결과.
- **동작**: 추출을 임시 파일(`.i18n-check.tmp.json`)로 실행해 커밋된 `en.json`과 diff 비교.
- **출력**: 성공 시 조용히 종료(임시 파일 삭제). 실패 시 `en.json is out of sync with code` 메시지와 함께 어떤 diff가 있는지 stdout에 출력.
- **종료 코드**: 일치 시 0, 불일치 시 비0.
- **사용 맥락**: CI `check-i18n` 잡의 핵심 게이트(User Story 2). 로컬에서도 동일 명령으로 재현 가능해야 한다(FR-007).

### Weblate 빈 번역 정리 대체 스크립트 (구현 단계에서 명명·설계)

- **입력**: `src/i18n/en.json`, `src/i18n/ko.json`.
- **동작**: `ko.json`에서 값이 빈 문자열이거나 `en.json`에 대응 키가 없는 항목(고아 키)을 검출한다.
- **출력**: 검출된 항목 목록(리포트) 및 `--check` 모드에서 비0 종료 코드로 CI 실패 유도.
- **사용 맥락**: CI `check-i18n` 잡에서 구 `clean-empty`/`check-empty-src`를 대체(research.md #5, User Story 3).

## 2. ESLint 규칙 계약 (`webapp/channels/.eslintrc.json`)

| 규칙 | 심각도 | 계약 |
|---|---|---|
| `formatjs/enforce-id` | error(배치 완료 파일) / 예외(배치 미완료 파일, overrides 목록) | 명시적 `id` 없는 메시지 디스크립터를 차단. |
| `formatjs/enforce-default-message` | error | `defaultMessage` 누락을 차단. |
| `formatjs/enforce-placeholders` | error | ICU 플레이스홀더와 `values` 불일치를 차단. |
| `formatjs/no-invalid-icu` | error | 잘못된 ICU 메시지 구문을 차단. |
| `formatjs/no-multiple-plurals` | warn | 복수형 처리 남용을 경고. |
| `formatjs/no-multiple-whitespaces` | error | 기존 규칙 유지(변경 없음). |
| `formatjs/no-literal-string-in-jsx` | warn | JSX 내 미번역 리터럴 문자열을 경고. |
| `formatjs/prefer-formatted-message` | warn | `<FormattedMessage>` 사용을 권장. |
| `formatjs/no-useless-message` | warn | 불필요한 메시지 선언을 경고. |
| `formatjs/prefer-pound-in-plural` | off | 비활성(upstream과 동일). |

`settings.formatjs.additionalFunctionNames`에 `localizeMessage`, `defineMessage`를 등록해 두 함수 호출도 위 규칙의 검사 대상에 포함시킨다.

## 3. CI 잡 계약 (`.github/workflows/webapp-ci.yml` → `check-i18n`)

- **선행 조건**: `check-lint` 잡 통과(ESLint `formatjs/*` 규칙 포함).
- **단계**: `npm run i18n-extract:check` → Weblate 빈 번역 정리 대체 검증.
- **성공 기준**: 두 단계 모두 종료 코드 0.
- **실패 시**: PR 병합 차단, 실패 로그에 불일치 메시지/키 목록 노출(Edge Case 대응).
- **보호 경로**: 이 파일 자체가 CODEOWNERS 보호 경로이므로 변경 PR은 코드오너 리뷰가 필요하다.
