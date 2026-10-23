# Quickstart: 팀 멤버 직접 등록 — 검증 실주행 가이드

**Date**: 2026-10-23 | **Spec**: [spec.md](spec.md) | **Contract**: [contracts/register-members-api.md](contracts/register-members-api.md)

구현 완료를 선언하기 전에 이 문서의 시나리오를 실제로 돌리고, SC-### 실측값을
기록한다(constitution 원칙 I·III).

## 준비

```bash
# 서버 (터미널 1)
cd server && make run-server

# 웹앱 watch 빌드 (터미널 2)
cd webapp && make run
```

- 계정: 시스템 관리자 1개, 팀 관리자 1개(대상 팀), 일반 멤버 1개.
- 설정 켜기: 시스템 콘솔 → Authentication → Signup → "팀 멤버 직접 등록 허용"
  (또는 `mmctl config set TeamSettings.EnableDirectMemberRegistration true`).

## 시나리오 1 — 한 명 등록 (US1, SC-001·SC-003)

1. 팀 관리자로 로그인 → 팀 메뉴 → "구성원 초대" → "직접 등록" 선택.
2. 이메일·이름·임시 비밀번호 입력(자동 생성 버튼도 1회 확인) → 등록.
3. 결과 화면에 "계정 생성 + 팀 등록 완료"가 표시되는지 확인.
4. 로그아웃 → 등록한 이메일+임시 비밀번호로 로그인.

**기대**: 등록 소요 1분 미만(SC-001 실측 기록). 추가 인증·승인 없이 곧바로
해당 팀 채널 화면에 도달(SC-003). 비밀번호 변경을 강제당하지 않는다.

## 시나리오 2 — CSV 일괄 등록 (US2, SC-002·SC-005)

1. "CSV 일괄 등록" 탭에서 템플릿을 내려받아 행을 채운다. 다음을 섞는다:
   정상 행 다수(100행 권장), 이메일 형식 오류 1행, 비밀번호 정책 미달 1행,
   파일 내 중복 이메일 1행, 기존 계정 이메일 1행, 이미 팀 멤버인 이메일 1행.
2. 업로드 → 미리보기에서 행별 검증 표시를 확인 → 등록 실행.
3. 결과 화면과 결과 CSV(임시 비밀번호 포함)를 확인.

**기대**: 정상 행 전부 등록 + 오류 행 전부 사유 표시, 누락 0건(SC-005).
기존 계정 행은 "기존 계정을 팀에 추가", 이미 멤버 행은 "할 일 없음"으로 구분.
업로드→결과 확인까지 5분 이내(SC-002 실측 기록). 정상 행으로 생성된 계정 중
표본 2~3개로 로그인 확인.

## 시나리오 3 — 설정·권한 차단 (US3, SC-004)

1. 설정 끔 → 팀 관리자의 초대 모달에 "직접 등록"이 보이지 않는지 확인.
2. 설정 끔 상태에서 API 직접 호출이 거부되는지 확인:

   ```bash
   curl -s -o /dev/null -w '%{http_code}\n' \
     -H "Authorization: Bearer <팀관리자 토큰>" -H 'Content-Type: application/json' \
     -d '[{"email":"x@y.co","name":"테스트","password":"Abcd!2345"}]' \
     http://localhost:8065/api/v4/teams/<team_id>/members/register
   # 기대: 501
   ```

3. 설정 켬 + 일반 멤버 토큰으로 같은 호출 → 기대: 403. 모달에도 "직접 등록"이
   보이지 않는다.
4. 설정 켬 + 팀 관리자 → 모달에 "직접 등록"이 나타나고 호출이 201을 반환한다.

**기대**: 차단 경로 전부 거부(SC-004 — UI·API 거부율 100%).

## 시나리오 4 — 기존 초대 경로 불변 (SC-006)

1. "초대 보내기"(기존 방식)에서 이름 검색으로 기존 사용자 팀 추가 1회,
   이메일 초대 발송 1회를 수행한다.
2. 팀 초대 링크로 신규 가입 1회를 수행한다.

**기대**: 세 경로 모두 기능 추가 전과 같이 동작(SC-006).

## 품질 게이트 (원칙 I — 기준선 diff로 판정)

```bash
# 구현 시작 전 기준선 저장, 마감 때 같은 명령으로 diff
cd server && make check-style && make test-server
cd webapp && npm run check && npm run check-types && npm run test
```

i18n 검증: 서버 `make i18n-check`, 웹앱 `npm run i18n-extract` 후 diff 클린.

## 완료 판정

- [ ] 시나리오 1~4 실주행 + SC-001~006 실측값 기록
- [ ] 두 패키지 게이트 통과 출력 + 기준선 대비 실패 목록 diff 첨부
- [ ] 테스트 과제별 구현 전 실패 출력 보존(원칙 III)
