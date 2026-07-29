# Quickstart: i18n 추출 도구 마이그레이션 검증

이 기능이 실제로 동작하는지 로컬에서 확인하기 위한 실행 가이드다. 구현 세부사항이 아니라 **검증 시나리오**만 다룬다 — 상세 계약은 [contracts/i18n-tooling-contract.md](./contracts/i18n-tooling-contract.md), 데이터 구조는 [data-model.md](./data-model.md) 참고.

## 사전 준비

```bash
cd webapp
npm ci
```

Node 버전은 `.nvmrc`(20.11) 기준을 따른다.

## 시나리오 1 — 신규 메시지 ID 강제 확인 (User Story 1)

1. `webapp/channels/src` 내 임의 컴포넌트에 `id` 없이 `defaultMessage`만 있는 메시지를 추가한다.
2. 린트를 실행한다:
   ```bash
   npm run check --workspace=channels
   ```
3. **기대 결과**: `formatjs/enforce-id` 위반으로 오류가 발생한다(단, 해당 파일이 배치 미완료 예외 목록에 없는 경우).
4. 메시지에 명시적 `id`를 추가한 뒤 같은 명령을 재실행한다.
5. **기대 결과**: 오류 없이 통과한다.

## 시나리오 2 — 로컬에서 CI와 동일한 i18n 검증 재현 (User Story 2, FR-007)

1. 위 시나리오에서 추가한 메시지를 그대로 둔 상태에서 추출을 실행한다:
   ```bash
   npm run i18n-extract --workspace=channels
   ```
2. `git diff webapp/channels/src/i18n/en.json`으로 새 메시지가 반영됐는지 확인한다.
3. CI와 동일한 일치 검증을 로컬에서 재현한다:
   ```bash
   npm run i18n-extract:check --workspace=channels
   ```
4. **기대 결과**: `en.json`을 커밋하지 않은 상태로 재실행하면 실패 메시지와 함께 비0 종료 코드가 나오고, 커밋 후에는 통과한다.

## 시나리오 3 — `ko.json` 번역 보존 확인 (User Story 3, SC-003)

1. 마이그레이션 배치 적용 전 `en.json`/`ko.json`의 키 집합을 저장해 둔다(예: `jq -r 'keys[]' src/i18n/en.json | sort > /tmp/en-keys-before.txt`, `ko.json`도 동일).
2. 대상 배치를 적용한다(해당 디렉터리의 기존 메시지에 id 부여, `en.json`/`ko.json` 동시 갱신).
3. 배치 적용 후 동일한 방식으로 키 집합을 다시 추출한다.
4. **기대 결과**:
   - 배치 이전에 `ko.json`에 번역돼 있던 키는 이후에도 동일한 번역 값을 유지한다(값 diff 없음).
   - `en.json`에서 키 이름이 바뀐 경우에만 `ko.json`에 대응하는 변경이 함께 존재한다.

## 시나리오 4 — Weblate 빈 번역 정리 대체 검증 (research.md #5)

1. `ko.json`에 임의의 키를 빈 문자열 값으로 설정한다.
2. 구현 단계에서 추가되는 대체 스크립트를 실행한다(정확한 명령은 tasks.md에서 확정).
3. **기대 결과**: 빈 문자열 항목이 리포트에 검출되고, `--check` 모드에서는 비0 종료 코드를 반환한다.

## 시나리오 5 — 배치 진행 상황 추적 (SC-005)

1. `.eslintrc.json`의 배치 미완료 예외 목록에서 완료된 디렉터리를 제거한다.
2. 린트를 재실행해 해당 디렉터리의 모든 메시지가 `enforce-id`를 통과하는지 확인한다.
3. **기대 결과**: 예외 목록이 비게 되면(모든 배치 완료) `en.json`의 모든 메시지가 명시적 id를 가진 상태가 된다 — `@formatjs/cli extract --throws` 실행 시 미표시 id로 인한 오류가 0건이어야 한다.
