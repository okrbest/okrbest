# Phase 1 데이터 모델: role_updated 이벤트 스코프 제한

## Role (기존 엔티티 확장)

`server/public/model/role.go`의 기존 `Role` 구조체에 필드 하나를 추가한다.

| 필드 | 타입 | 설명 |
|---|---|---|
| `SchemeId` | `*string` (nullable) | 이 역할이 속한 scheme의 ID. `nil`이면 소속 scheme 없음(전역 처리 대상). |

**유효성 규칙**:
- `BuiltIn: true`인 역할은 `SchemeId`가 항상 `nil`이다(빌트인 역할은 scheme에 속하지 않음).
- scheme이 역할을 생성할 때(`createScheme`)만 `SchemeId`가 채워진다. 역할 생성 이후 다른 scheme으로 재소속되는 경로는 없다(upstream에도 없음 — 이번 기능의 범위 밖).
- 기존(이 기능 도입 이전) 역할은 `SchemeId`가 비어 있다가, backfill 마이그레이션이 role name을 scheme의 `default*Role` 컬럼과 매칭해 채운다.

**상태 전이**: 없음(생성 시 결정되며 이후 변경되지 않는 값 — 삭제 시에만 관련 scheme과 함께 소프트 삭제).

## Scheme (기존 엔티티, 변경 없음 — 참조용)

`server/public/model/scheme.go`의 `Scheme`은 이번 기능의 변경 대상이 아니지만, `Role.SchemeId`가 가리키는 대상이라 관계를 명시한다.

| 필드 | 관련성 |
|---|---|
| `Id` | `Role.SchemeId`가 참조하는 대상 |
| `Scope` | `team` / `channel` / `playbook` / `run` — 이벤트 스코프 분기 기준(스코프 값 자체는 기존 그대로, 신규 값 추가 없음) |

## 관계

```
Scheme (1) ──< schemeid FK(논리적, DB 제약 없음) >── Role (N)
```

- 하나의 scheme은 여러 역할(team admin/user/guest, channel admin/user/guest 등)을 가질 수 있다.
- 역할은 최대 하나의 scheme에 속하거나(`SchemeId` non-nil), 어디에도 속하지 않는다(`SchemeId` nil, 예: 빌트인 역할·소속 없는 커스텀 역할).
- DB 레벨 FK 제약은 두지 않는다(upstream도 두지 않음 — role/scheme 삭제 순서에 유연성을 주기 위한 기존 설계 관례를 따른다).

## 이벤트 발행 시 분기 기준 (참고 — 구현 세부는 plan.md Project Structure 참고)

| 역할 유형 | 판별 조건 | 전달 범위 |
|---|---|---|
| 빌트인 | `Role.BuiltIn == true` | 전역(모든 접속 세션) |
| 소속 없는 커스텀 | `Role.SchemeId == nil` | 전역 |
| team-scheme | `Scheme.Scope == "team"` | 해당 team 소속 세션만(최대 100,000건) |
| channel-scheme | `Scheme.Scope == "channel"` | 해당 channel 소속 세션만(최대 100,000건) |
| playbook/run-scheme | `Scheme.Scope == "playbook"` 또는 `"run"` | 전역(team/channel 매핑 없음) |
