# Quickstart: 팀 멤버 프로필 부서/직위 표시 검증

**Feature**: [spec.md](./spec.md) | 계약: [org-profile-summary.md](./contracts/org-profile-summary.md) | 데이터 모델: [data-model.md](./data-model.md)

이 문서는 구현 완료 후 기능이 end-to-end로 동작하는지 확인하기 위한 실행 가능한 검증 시나리오를 제공한다. 구현 코드나 전체 테스트 스위트는 포함하지 않는다.

## 사전 준비

- 로컬 개발 서버가 기동되어 있고(`server/Makefile` 기준 `run-server` 또는 동등한 개발 절차), `EnableOrgRoleManagement` 기능 플래그가 켜져 있어야 한다(`MM_FEATUREFLAGS_ENABLEORGROLEMANAGEMENT=true`).
- 다음 계정이 준비되어 있어야 한다:
  - 팀 관리자 계정 A (같은 팀에서 `PermissionManageTeamRoles` 보유)
  - 일반 멤버 계정 B, C (같은 팀 소속)
  - 다른 팀 소속의 일반 멤버 계정 D

## 시나리오 1 — User Story 1: 동료 프로필 카드에서 부서/직위 확인

1. 관리자 A로 로그인 → 팀 관리 콘솔의 "조직/직위 관리" 화면에서 멤버 C에게 부서 "개발팀", 직위 "팀장"을 지정하고 저장한다.
2. 멤버 B로 로그인 → 멤버 C가 보낸 메시지의 아바타/이름을 클릭해 프로필 카드를 연다.
3. **기대 결과**: 프로필 카드에 "개발팀 · 팀장"이 한 줄로 표시된다(FR-002a).
4. 관리자 A로 돌아가 멤버 C의 직위만 미지정으로 되돌린 뒤, 멤버 B가 다시 프로필 카드를 연다.
5. **기대 결과**: "개발팀 · 직위 미지정"이 표시된다(spec Clarifications §1).

## 시나리오 2 — User Story 2: 계정 설정에서 읽기 전용 확인

1. 관리자 A가 멤버 B 본인 계정에 부서 "인사팀"만 지정(직위는 미지정)하고 저장한다.
2. 멤버 B로 로그인 → 계정 설정 → 프로필 탭을 연다.
3. **기대 결과**: "부서" 행에 "인사팀", "직위" 행에 "미지정"이 각각 표시되고, 두 행 모두 입력창/저장 버튼 없이 안내 문구만 보인다(FR-002b, FR-005~FR-007).
4. 두 행 중 어느 것도 클릭 시 편집 모드로 전환되지 않는지 확인한다(FR-006).

## 시나리오 3 — User Story 3 & Q2: 팀 맥락이 없을 때 숨김

1. 멤버 D(다른 팀 소속)로 로그인한 상태에서 멤버 C와 다이렉트 메시지를 연다.
2. 멤버 C의 프로필 카드를 연다.
3. **기대 결과**: 부서/직위 행 자체가 표시되지 않는다(값이 "미지정"으로 보이는 것과 구분됨, User Story 3).
4. (해당하는 경우) 소속 팀이 전혀 없는 테스트 계정으로 계정 설정을 열어, "부서"/"직위" 행 자체가 나타나지 않는지 확인한다(spec Clarifications §2).

## API 계약 직접 검증(선택)

[org-profile-summary.md](./contracts/org-profile-summary.md)에 정의된 응답/오류를 curl 등으로 직접 확인할 수 있다:

```bash
# 같은 팀 일반 멤버 토큰으로 200 확인
curl -s -H "Authorization: Bearer <member_B_token>" \
  "$SITEURL/api/v4/teams/<team_id>/users/<user_C_id>/org-profile-summary"

# 다른 팀 소속 사용자에 대해 404 확인
curl -s -H "Authorization: Bearer <member_B_token>" \
  "$SITEURL/api/v4/teams/<team_id>/users/<user_D_id>/org-profile-summary"
```

## 회귀 확인

- 기존 관리자 전용 조회(`GET .../org-profile`, `GET .../org-profiles`)와 배정(`PUT .../org-profile`)이 여전히 팀관리자/시스템관리자 권한으로만 동작하는지 확인한다(FR-008) — `specs/001-org-role-bulk-assign`의 기존 검증 시나리오 재실행으로 충분하다.
- 프로필 카드에서 기존 자유 텍스트 `user.position` 표시가 더 이상 나타나지 않는지 확인한다(FR-004).
