# Quickstart: 시스템 관리자 테마 전체 적용 — 종단 검증

**Date**: 2026-10-08 | **Plan**: [plan.md](./plan.md) | **Contract**: [contracts/apply-theme-to-all.md](./contracts/apply-theme-to-all.md)

구현 완료 판정은 이 문서의 실주행 결과와 SC-001~SC-005 실측값으로 한다
(constitution 원칙 I·III).

## 준비

```bash
# 서버 (PostgreSQL 포함 로컬 기동)
cd server && make run-server

# 웹앱 (별도 터미널)
cd webapp && make run
```

계정 준비 (기존 로컬 환경에 없으면 mmctl 또는 시스템 콘솔로 생성):

- 시스템 관리자 1명 (`admin`)
- 일반 사용자 2명 (`user-a`, `user-b`) — `user-b`는 팀 2곳 가입 + 팀별로 다른
  테마를 미리 설정해 둔다
- 봇 계정 1개, 비활성화한 계정 1개

## 시나리오 1 — 전체 적용 (SC-001, User Story 1)

1. 브라우저 A: `admin` 로그인 → 설정 > 화면 > 테마 → Denim 선택.
2. "모든 팀원에게 새로운 테마를 적용합니다" 체크 → 저장.
3. **기대**: 저장 1회로 끝난다. 추가 조작 없음.
4. 확인 (DB 또는 API):

```bash
# user-a의 테마가 Denim이 됐는지
curl -s -H "Authorization: Bearer $USER_A_TOKEN" \
  http://localhost:8065/api/v4/users/me/preferences | jq '[.[] | select(.category=="theme")]'
# 기대: name=="" 1건, value에 Denim. 팀 ID name 행 없음.
```

- `user-b`: 팀별 테마 행이 사라지고 전역 Denim 1건만 남는다 (FR-003).
- 봇·비활성 계정: preference 변화 없음 (FR-002).

## 시나리오 2 — 권한 강제 (SC-004, User Story 2)

1. 브라우저 B: `user-a` 로그인 → 설정 > 화면 > 테마.
2. **기대**: "모든 팀원에게…" 체크박스가 보이지 않는다.
3. API 직접 호출:

```bash
curl -s -o /dev/null -w "%{http_code}\n" -X POST \
  -H "Authorization: Bearer $USER_A_TOKEN" \
  -d '{"theme":"{\"type\":\"Onyx\"}"}' \
  http://localhost:8065/api/v4/users/theme/apply_to_all
# 기대: 403
```

4. 403 이후 아무 사용자의 테마도 바뀌지 않았는지 시나리오 1의 조회로 재확인.

## 시나리오 3 — 접속 중 즉시 반영 (SC-003, User Story 3)

1. 브라우저 A(`admin`)와 브라우저 B(`user-a`)를 나란히 띄운다.
2. `admin`이 Onyx로 바꿔 전체 적용 저장.
3. **기대**: 브라우저 B 화면이 **새로고침 없이 5초 안에** Onyx로 바뀐다.
   실측값(초)을 기록한다.

## 시나리오 4 — 일회성 보장 (SC-005, FR-004)

1. 시나리오 3 직후 `user-a`가 자기 설정에서 Quartz로 변경.
2. **기대**: 변경이 유지된다. 서버가 되돌리지 않는다 (새로고침 후에도 Quartz).

## 시나리오 5 — 형식 오류 거부 (FR-010)

```bash
curl -s -o /dev/null -w "%{http_code}\n" -X POST \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"theme":"{\"sidebarBg\":\"not-a-color\"}"}' \
  http://localhost:8065/api/v4/users/theme/apply_to_all
# 기대: 400, 어떤 사용자의 테마도 변경 없음
```

## 성능 확인 (SC-002)

로컬에서 1,000명 규모를 재현하기 어려우면 스토어 테스트로 대체 측정한다:
storetest에 사용자 1,000명 시드 후 `ApplyThemeToAllUsers` 1회 실행 시간을
기록한다 (기대: 10초 이내 — 단일 SQL이므로 통상 1초 미만).

## 자동화 게이트 (머지 전)

```bash
# 기준선을 구현 시작 전에 저장해 두고, 마감 때 동일 명령으로 diff 판정
cd server && make check-style && make test-server
cd webapp && npm run check && npm run check-types && npm run test
```
