# Contracts: 첫 화면(로그인 랜딩) 설정

**Date**: 2026-10-25 | **Plan**: [../plan.md](../plan.md)

신규 엔드포인트는 없다. 기존 API 두 개의 계약을 확장·규약화한다.

## 1. patchTeam 확장 — 팀 기본값 저장

`PUT /api/v4/teams/{team_id}/patch` (기존 엔드포인트, 필드 1개 추가)

**요청 본문 (추가 필드)**:

```json
{
  "landing_product": "boards"
}
```

| 규칙 | 내용 |
|---|---|
| 허용 값 | `""` · `"boards"` · `"playbooks"` |
| 생략 시 | 기존 값 유지 (TeamPatch 포인터 의미론) |
| 권한 | 기존과 동일 — `MANAGE_TEAM` 없으면 403 |
| 검증 실패 | 허용 외 값이면 400 (`Team.IsValid`) |
| 응답 | 갱신된 Team 객체에 `landing_product` 포함 |

**조회**: 별도 API 없음. 기존 팀 조회(`GET /api/v4/teams/{team_id}` 등)와
웹소켓 `team_updated` 이벤트에 필드가 실려 모든 구성원에게 전파된다.

## 2. preferences 규약 — 개인 설정 저장

`PUT /api/v4/users/{user_id}/preferences` (기존 엔드포인트, 신규 category 규약)

**요청 본문 예시**:

```json
[
  {
    "user_id": "{user_id}",
    "category": "landing_product",
    "name": "{team_id}",
    "value": "playbooks"
  }
]
```

| 필드 | 규약 |
|---|---|
| category | `landing_product` 고정 |
| name | 팀 ID(팀별 설정) 또는 `""`(모든 팀 공통) |
| value | `channels` · `boards` · `playbooks` |
| 삭제 | "팀 기본값 따르기" 선택 시 `POST /api/v4/users/{user_id}/preferences/delete` |

서버는 category·name 32자 제한만 검증한다(기존 동작). value 검증은 webapp
판정 로직이 알 수 없는 값을 무시하는 방식으로 방어한다(알 수 없는 값 = 해당
후보 건너뜀).

## 3. webapp 내부 계약 — 랜딩 판정

`redirectUserToDefaultTeam`(`webapp/channels/src/actions/global_actions.tsx`)의
확장 계약:

1. 도착 팀 확정까지는 기존 로직 그대로다 (팀 없음 → `/select_team` 등 불변).
2. 팀 확정 후 `resolveLandingProduct(state, teamId)`를 호출한다
   ([data-model.md](../data-model.md) 판정 함수).
3. 판정이 `channels`가 아니면 product 초기화 완료를 최대 5초 기다린 뒤 재판정한다.
   5초 안에 등록이 끝나지 않으면 `channels`로 보낸다. 저장값은 바꾸지 않는다.
4. 이동 URL: `channels` → 기존 채널 URL 계산 그대로, `boards` → `/boards`,
   `playbooks` → `/playbooks`.
5. `redirect_to` 쿼리·초대 진입 등 이 함수에 도달하지 않는 경로는 건드리지
   않는다 (FR-010).

**테스트로 고정할 계약**: 판정 셀렉터의 우선순위 표(개인 팀별 > 개인 공통 >
팀 기본 > 채널) × 가용성(등록/미등록) 조합, 그리고 "설정 없음 → 기존 URL과
동일" 회귀 케이스.
