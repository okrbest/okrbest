# Quickstart 검증 가이드: 직책 관리

## 사전 조건

- 003(본부-부서 계층) 반영 상태 (`27f7c2e79b` 이후)
- 로컬 환경 기동(DEVELOPMENT.md) + 팀 관리자 로그인
- 서버 재시작 시 마이그레이션 000153 자동 적용 확인:
  ```sh
  docker exec -e PGPASSWORD="$POSTGRES_PASSWORD" mattermost-postgres \
    psql -U mmuser -d mattermost_test \
    -c "SELECT column_name FROM information_schema.columns WHERE table_name='positiondefinitions' AND column_name='kind';"
  ```

## 자동 테스트

```sh
cd server
go test ./public/model/ -run TestPositionDefinition -count=1
go test ./channels/app/ -run 'TestOrgRole|TestDuty|TestOrgUnit' -count=1
go test ./channels/api4/ -run 'TestTeamOrgRoles|TestGetUserOrgProfileSummary|TestDuty' -count=1

cd ../webapp
npm run test -- org_role_management profile_popover_org_role user_settings_general
```

기대: 전부 통과.

## 수동 시나리오

### US1 — 직책 정의 관리

1. 부서/직위 관리 진입 → "직책 추가" → "팀장"(rank 1), "본부장"(rank 0) 저장.
2. 직책 리스트에 본부장→팀장 순(rank) 표시 확인. 직위 리스트와 분리 확인.
3. 직책 폼·리스트에 "보드 전체보기" 없음 확인 (FR-012).
4. 기존 직위 리스트 영향 없음 확인 (SC-002).
5. 직책 하나 삭제 → 리스트·선택지에서 사라짐 확인.

### US2 — 배정·필터·일괄

1. 사용자 A: 직위=부장 + 직책=팀장 동시 배정 저장 → 새로고침 후 둘 다 유지 확인.
2. 필터 직책="팀장" → A만 조회. 소속 필터와 조합(AND) 확인.
3. 사용자 2명 선택 → 일괄 지정 직책="본부장" 적용·저장 → 전원 반영 확인.
4. 일괄 지정 "변경 안 함" 기본값이 기존 직책 유지하는지 확인.
5. API 직접 호출로 교차 배정 400 확인:
   ```sh
   curl -s -X PUT -H "Authorization: Bearer $TOKEN" \
     -d '{"primary_duty_id":"<직위ID>","primary_position_id":"","primary_org_unit_id":""}' \
     http://localhost:8065/api/v4/teams/$TEAM_ID/users/$USER_ID/org-profile
   ```

### US3 — 표시

1. A(본부>부서·팀장·부장) 프로필 카드 → "본부 > 부서 · 팀장 · 부장".
2. 직책 없는 사용자 → 직책 세그먼트 생략(기존 형식 그대로).
3. 직책만 있는 사용자 → "… · 팀장 · 직위 미지정".
4. 계정 설정 → 직책 행이 배정자에게만 읽기 전용으로 표시.

## 회귀 확인

- 마이그레이션 후 기존 직위·배정 데이터 그대로 (kind='position' 자동).
- down 마이그레이션 롤백 후 003 상태로 복귀 확인(개발 환경에서만).

## 완료 판정

자동 테스트 + US1~US3 + 교차 배정 400 + 회귀 확인 전부 통과.
