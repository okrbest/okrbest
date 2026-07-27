# Quickstart: 조직/직위 관리 다중 선택 · 일괄 지정 · 일괄 저장 검증 가이드

## 사전 준비

- Node `.nvmrc`(20.11) 버전, npm workspaces 의존성 설치 완료(`webapp/` 루트에서 `npm install`).
- 로컬에서 웹앱 dev 서버 또는 관리자 콘솔에 접근 가능한 환경(기존 프로젝트 실행 방식 그대로, 이번 기능은 신규 실행 스크립트를 추가하지 않음).
- 시스템 콘솔 접근 권한이 있는 관리자 계정, `PermissionSysconsoleWriteUserManagementTeams`(또는 `PermissionManageTeamRoles`) 보유.
- 부서/직위가 이미 1개 이상 등록되어 있고 팀 멤버가 2명 이상인 팀 (없다면 "조직/직위 관리" 화면 내 부서/직위 추가 폼으로 먼저 생성).

## 자동 검증 (테스트)

```bash
# webapp 루트 또는 channels 패키지에서 실행 (기존 스크립트 재사용, 신규 스크립트 없음)
npm run test -- org_role_management
npm run check-types
npm run check

# 신규 admin.org_role_management.* 문자열을 en.json에 추출하고 ko.json 누락 여부 확인
npm run i18n-extract
npm run i18n-check-empty-src
```

기대 결과: `org_role_management.test.tsx`의 기존 테스트(필터/검색, 단건 저장 회귀) + data-model.md/spec.md 기반 신규 테스트(체크박스 선택, 전체 선택 범위, 일괄 지정 필드 병합, Dirty 기준 저장 호출 수, 부분 실패 요약)가 모두 통과.

## 수동 검증 시나리오

### 시나리오 1 — 일괄 지정 + 일괄 저장 (spec.md User Story 1)

1. 관리자 콘솔 → 해당 팀의 "조직/직위 관리" 화면 진입.
2. 사용자 리스트에서 서로 다른 직위를 가진 사용자 2명 이상을 체크박스로 선택.
3. 일괄 지정 툴바에서 "일괄 부서"만 선택하고("일괄 직위"는 그대로 둠) "선택 적용" 클릭.
4. **확인**: 선택된 사용자들의 부서 값만 화면상에서 바뀌고, 각자의 직위 값은 그대로 유지됨.
5. 상단 "저장" 버튼 클릭.
6. **확인**: 변경된 사용자 수만큼 성공 메시지가 표시되고, 변경하지 않은 다른 사용자는 저장 요청이 발생하지 않음(네트워크 탭으로 PUT 호출 수 확인 가능).

### 시나리오 2 — 필터 범위 전체 선택 + 선택 유지 (spec.md User Story 2)

1. 사용자 검색어를 입력해 목록을 2~3명으로 좁힘.
2. 헤더의 "전체 선택" 체크박스 클릭.
3. **확인**: 현재 화면에 보이는 사용자만 선택됨.
4. 검색어를 지워 전체 목록을 다시 표시.
5. **확인**: 이전에 검색으로 좁혀 선택했던 사용자들의 체크 상태가 그대로 유지되어 있음(다른 사용자는 미선택 상태).

### 시나리오 3 — 부분 실패 요약 (spec.md User Story 3)

1. 개발자 도구 등으로 특정 사용자에 대한 `org-profile` PUT 요청만 실패하도록 임시 조건을 만들거나, 네트워크를 일시 차단한 상태에서 여러 사용자를 변경 후 저장.
2. **확인**: 성공/실패 건수가 함께 표시되고, 실패가 있는 동안 메시지가 자동으로 사라지지 않음.
3. 정상 상태로 되돌린 뒤 실패했던 사용자만 다시 선택/저장해 재시도가 가능한지 확인.

### 시나리오 4 — Dirty 없음 시 저장 비활성화

1. 화면 진입 직후(아무 것도 변경하지 않은 상태)에서 "저장" 버튼이 비활성화되어 있는지 확인.

## 참고 문서

- 엔티티/상태 상세: [data-model.md](./data-model.md)
- 재사용 API 계약: [contracts/reused-org-profile-endpoint.md](./contracts/reused-org-profile-endpoint.md)
- 기술 결정 근거: [research.md](./research.md)
