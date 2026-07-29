# Quickstart 검증 가이드: 본부-부서 계층 관리

구현 완료 후 기능이 end-to-end로 동작함을 확인하는 절차.

## 사전 조건

- 로컬 개발 환경 기동: DEVELOPMENT.md 절차 (postgres 컨테이너 + `make run-server`
  + webapp `make run`)
- 팀 관리자 계정으로 로그인 (백업 DB 복원 환경이면 기존 운영 계정 사용 가능)

## 자동 테스트

```sh
# 서버 — org_role 단위·API 테스트
cd server
go test ./channels/app/ -run TestOrgRole -v
go test ./channels/api4/ -run 'TestOrgUnit|TestGetUserOrgProfileSummary' -v

# 품질 게이트 (constitution I)
make check-style

# 웹앱 — 관리 화면·프로필 카드 컴포넌트 테스트
cd ../webapp
npm run test -- org_role_management
npm run test -- profile_popover_org_role
npm run check && npm run check-types
```

기대: 전부 통과.

## 수동 시나리오 (스토리별)

### US1 — 본부 생성·부서 소속 (P1)

1. 시스템 콘솔(또는 팀 설정)의 부서/직위 관리 진입.
2. "본부 추가" → "경영지원본부" 저장 → 본부 리스트에 표시 확인.
3. "부서 추가" → 소속 본부 = 경영지원본부 선택 → 부서 리스트에서 경영지원본부
   그룹 아래 표시 확인.
4. 기존(무소속) 부서 하나의 소속 본부를 경영지원본부로 변경 → 그룹 이동 + 해당
   부서 배정 사용자의 소속 유지 확인.
5. 소속 미선택 부서가 "미소속" 그룹에 있는지 확인.

### US2 — 본부 직속 배정·필터 (P2)

1. 사용자 A의 소속 select 열기 → 본부/부서 optgroup 구분 확인 (비활성 항목 미노출).
2. A를 "경영지원본부"(직속) 배정, B를 하위 부서 배정 후 저장.
3. 필터에서 경영지원본부 선택 → A·B 모두 표시 확인.
4. 필터에서 하위 부서 선택 → B만 표시(A 제외) 확인.

### US3 — 프로필 카드 표시 (P3)

1. B(본부>부서 배정)의 프로필 카드 → "경영지원본부 > 인사팀" 형식 확인.
2. A(본부 직속) 프로필 카드 → "경영지원본부"만 표시 확인.
3. 무소속 부서 배정 사용자 → 부서명만 표시 확인 (기존 동작 회귀 없음).

### 가드·엣지 (FR-002, FR-006, FR-011, FR-013)

1. 하위 부서가 있는 본부 비활성화 시도 → 차단 + 이관 안내 문구 확인.
2. 직속 배정만 있는 본부 비활성화 시도 → 동일 차단 확인.
3. 하위·직속 모두 이관 후 비활성화 → 성공. 비활성 본부가 선택지에서 사라짐 확인.
4. API 직접 호출로 `type: "team"` 생성 시도 → 400 확인:
   ```sh
   curl -s -X POST -H "Authorization: Bearer $TOKEN" \
     -d '{"name":"x","type":"team"}' \
     http://localhost:8065/api/v4/teams/$TEAM_ID/org-units
   ```
5. API 직접 호출로 division에 parent_id 지정 생성 시도 → 400 확인.

## 회귀 확인 (SC-002)

- 백업 DB 복원 환경에서 기존 부서·직위·배정이 그대로 표시되는지 확인 (전부
  "미소속" 그룹, 데이터 손실 0).
- 계정 설정의 부서/직위 읽기 전용 표시 기존 동작 유지 확인.

## 완료 판정

- 자동 테스트 전부 통과 + 수동 시나리오 US1~US3·가드 체크 통과 + i18n(en/ko)
  누락 경고 없음 → 기능 완료 (verification-before-completion 기준).
