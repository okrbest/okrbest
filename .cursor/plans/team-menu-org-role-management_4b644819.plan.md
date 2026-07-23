---
name: team-menu-org-role-management
overview: 팀 메뉴에 부서/직위 관리 진입점을 추가하고, 팀관리자가 접근/수정할 수 있도록 권한과 화면 흐름을 팀 권한 중심으로 재구성합니다.
todos:
  - id: add-team-menu-entry
    content: 팀 메뉴(데스크톱/모바일)에 부서/직위 관리 진입 항목 추가
    status: pending
  - id: extract-reuse-org-role-ui
    content: 기존 org_role_management를 팀 UI에서도 재사용 가능하게 분리/연결
    status: pending
  - id: enable-team-admin-permission-path
    content: org-role API에 팀관리자 권한 기반 접근/수정 경로 추가
    status: pending
  - id: validate-permission-and-ui-regression
    content: 권한/노출/저장 회귀 테스트 및 수동 검증
    status: pending
isProject: false
---

# 팀 메뉴 기반 부서/직위 관리 전환 계획

## 목표
- `팀 메뉴`에 `부서/직위 관리` 항목을 추가
- 팀관리자(`team_admin`)가 관리자 콘솔 없이도 부서/직위 관련 작업 가능
- 권한 체계를 팀 권한 기준으로 맞춰 일관된 UX 제공

## 최종 의사결정 요약
- `관리자 콘솔 > 조직/직위 관리`는 실사용 경로에서 제외
- 팀 메뉴를 단일 진입점으로 사용
- 팀관리자 권한으로 부서/직위 `정의 + 배정` 모두 수행
- 시스템 권한 경로는 하위호환으로 유지하되, UI 노출은 팀 메뉴 중심으로 전환

## 변경 대상
- [d:/okrbest/okrbest/webapp/channels/src/components/sidebar/sidebar_header/sidebar_team_menu.tsx](d:/okrbest/okrbest/webapp/channels/src/components/sidebar/sidebar_header/sidebar_team_menu.tsx)
- [d:/okrbest/okrbest/webapp/channels/src/components/mobile_sidebar_right/mobile_sidebar_right_items/mobile_sidebar_right_items.tsx](d:/okrbest/okrbest/webapp/channels/src/components/mobile_sidebar_right/mobile_sidebar_right_items/mobile_sidebar_right_items.tsx)
- [d:/okrbest/okrbest/webapp/channels/src/components/team_members_modal/team_members_modal.tsx](d:/okrbest/okrbest/webapp/channels/src/components/team_members_modal/team_members_modal.tsx)
- [d:/okrbest/okrbest/webapp/channels/src/components/admin_console/org_role_management/org_role_management.tsx](d:/okrbest/okrbest/webapp/channels/src/components/admin_console/org_role_management/org_role_management.tsx)
- [d:/okrbest/okrbest/webapp/channels/src/components/admin_console/admin_definition.tsx](d:/okrbest/okrbest/webapp/channels/src/components/admin_console/admin_definition.tsx)
- [d:/okrbest/okrbest/server/channels/api4/team.go](d:/okrbest/okrbest/server/channels/api4/team.go)
- [d:/okrbest/okrbest/server/channels/api4/team_org_roles_test.go](d:/okrbest/okrbest/server/channels/api4/team_org_roles_test.go)

## UX 설계
- 팀 메뉴 신규 항목
  - 라벨: `부서/직위 관리`
  - 위치: `멤버 관리`와 인접(사용자 기대 위치)
  - 플랫폼: 데스크톱/모바일 동시 제공
- 관리 화면 구성
  - 탭 1: `부서/직위 정의`
    - 부서/직위 생성, 수정, 비활성
    - 검색 및 기본 정렬 제공
  - 탭 2: `멤버 배정`
    - 사용자별 부서/직위 선택, 저장
    - 현재 선택된 팀 컨텍스트 고정(팀 선택 드롭다운 제거)
- 멤버 관리 연계
  - 기존 `멤버 관리` 화면은 역할 변경 중심으로 유지
  - 필요 시 `부서/직위 관리`로 이동하는 CTA(버튼/링크)만 제공

## 권한 정책(최종)
- 수정 가능
  - 팀관리자: `MANAGE_TEAM_ROLES` 권한 보유 사용자
  - 시스템관리자: 기존 상위 권한으로 허용
- 수정 불가
  - 일반 팀 멤버
- 노출 정책
  - 팀 메뉴 `부서/직위 관리` 항목은 팀관리자에게만 노출
  - 관리자 콘솔 `조직/직위 관리`는 비노출

## 구현 단계
1. 팀 메뉴에 새 진입점 추가
- 데스크톱: `sidebar_team_menu.tsx`에 메뉴 항목 및 openModal 연결
- 모바일: `mobile_sidebar_right_items.tsx`에 동등 항목 추가
- 권한 셀렉터로 팀관리자만 노출 제어

2. 화면 재사용 구조화
- `org_role_management`의 데이터/폼 로직을 팀 UI에서도 쓸 수 있게 분리
- 관리자 콘솔 전용 레이아웃/카피 제거, 팀 컨텍스트형 레이아웃으로 전환
- 팀 선택은 현재 팀 ID 고정으로 단순화

3. API 권한 경로 확장
- `team.go` org-role API 권한 검사에 팀 권한 경로 추가
- 읽기/쓰기 모두 팀 권한을 기준으로 허용 경로 구성
- 기존 시스템콘솔 권한 경로는 삭제하지 않고 병행 유지

4. 관리자 콘솔 비노출 정리
- `admin_definition.tsx`에서 `org_roles` 사이드바 노출 제거
- 내부 재사용 코드가 있더라도 콘솔 사용자 진입점은 제거

5. 테스트 및 회귀 검증
- 웹앱: 메뉴 노출, 저장 버튼 활성/비활성, 저장 성공/권한거부
- 서버: 팀관리자 성공, 일반 멤버 실패, 시스템관리자 성공
- 모바일: 메뉴 노출/진입 동작 확인

## API/데이터 체크리스트
- `positions`, `org-units`, `org-profile` CRUD/조회가 팀 권한에서 동작하는지
- 사용자 배정 저장 후 동기화(`User.Props`) 부작용 없는지
- feature flag 비활성 시 일관된 에러/노출 정책 유지

## 리스크 및 대응
- 권한 누락/과다 허용 리스크
  - 서버 테스트에 권한 매트릭스(팀관리자/멤버/시스템관리자) 필수 추가
- 사용자 수 증가 시 배정 조회 성능 리스크
  - 초기엔 페이지 단위 로딩, 필요 시 bulk API 후속 계획 수립
- UI 중복 인지 리스크
  - 팀 메뉴 단일 경로 정책을 릴리즈 노트/가이드에 명시

## 검증 포인트
- 팀관리자가 관리자 콘솔 없이 팀 메뉴에서 부서/직위 기능에 진입 가능
- 팀관리자만 수정 가능하고 일반 멤버는 읽기/미노출 처리
- 관리자 콘솔에서 `조직/직위 관리` 진입이 노출되지 않음

## 완료 기준(Definition of Done)
- 팀관리자 계정으로 팀 메뉴에서 부서/직위 정의 및 멤버 배정 저장 가능
- 일반 멤버 계정으로 편집 동작 수행 불가(미노출 또는 권한 차단)
- 관리자 콘솔에 `조직/직위 관리` 메뉴가 노출되지 않음
- 관련 웹앱/API 테스트 통과