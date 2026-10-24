# Research: 첫 화면(로그인 랜딩) 설정

**Date**: 2026-10-25 | **Plan**: [plan.md](plan.md)

브레인스토밍 단계에서 코드베이스를 병렬 탐색한 결과를 결정 단위로 정리한다.
Technical Context에 NEEDS CLARIFICATION은 없으며, 아래 결정이 그 근거다.

## D1. 팀 기본값 저장 — Teams 테이블 컬럼

- **Decision**: `Teams.LandingProduct VARCHAR(32) NOT NULL DEFAULT ''` 컬럼을
  추가한다. 값은 `''`(채널)·`boards`·`playbooks`. 변경은 기존 `patchTeam`
  API(`PUT /api/v4/teams/{team_id}/patch`)와 `MANAGE_TEAM` 권한을 재사용한다.
- **Rationale**: 팀 스코프 범용 key-value 저장소가 이 코드베이스에 없다. Team
  컬럼이면 팀 조회 한 번에 값이 따라오고(모든 구성원이 읽어야 하는 값에 적합),
  권한·API·캐시 무효화가 전부 기존 경로를 탄다. patchTeam은
  `server/channels/api4/team.go:477`에서 `PermissionManageTeam`을 이미 집행한다.
- **Alternatives considered**:
  - Property 시스템(PropertyField/Value) — TargetType이 `post`·`user`뿐이고 team
    용례가 없다. 신규 TargetType 도입은 이 기능 대비 과하다.
  - SystemStore·플러그인 KV — 권한 집행·클라이언트 전파를 전부 새로 만들어야 한다.
  - 서버 config — 전역값이라 팀별 설정이 불가능하다(030 기능과 요구가 다름).

## D2. 개인 설정 저장 — preference, 테마 패턴

- **Decision**: 신규 category `landing_product`, name=팀 ID(팀별) 또는
  `''`(모든 팀 공통), value는 `channels`·`boards`·`playbooks`. preference가
  없으면 "팀 기본값 따르기"다. 기존 `savePreferences` 액션과
  `PUT /api/v4/users/{id}/preferences`를 그대로 쓴다 — 서버 변경 없음.
- **Rationale**: 테마가 같은 구조의 유일한 선례다
  (`saveTheme` — actions/preferences.ts:99-113, `getThemePreference` —
  selectors/entities/preferences.ts:116-134: 팀 ID 키 우선, `''` 키 fallback).
  사용자에게 이미 익숙한 "모든 팀에 적용" UX를 재사용할 수 있다.
- **Alternatives considered**:
  - name에 `landing_` 접두사 + 팀 ID — category·name 각 32자 제한
    (server/public/model/preference.go:145-151)에서 팀 ID가 26자라 접두사 여유가
    6자뿐이다. 신규 category가 안전하다.
  - "팀 기본값 따르기"를 명시 값(`default`)으로 저장 — preference 부재와 의미가
    겹친다. 부재=따르기로 통일하고, UI에서 "따르기"를 고르면 해당 preference를
    삭제한다(테마의 `deleteTeamSpecificThemes` 선례).

## D3. 판정·이동 지점 — redirectUserToDefaultTeam 한 곳

- **Decision**: `webapp/channels/src/actions/global_actions.tsx:372`의
  `redirectUserToDefaultTeam`에서, 도착 팀이 확정된 직후 랜딩 제품을 판정한다.
  채널이면 기존 경로(`/{team}/channels/{channel}`) 그대로, 보드면 `/boards`,
  플레이북이면 `/playbooks`로 push한다(각 제품의 `switcherLinkURL`).
  판정 로직은 셀렉터(`selectors/landing.ts`)로 분리해 단위 테스트를 붙인다.
- **Rationale**: 로그인·루트 진입·웹소켓 강등 등 모든 진입 경로가 이 함수 하나로
  수렴한다는 것을 확인했다(root.tsx, login.tsx, signup.tsx, websocket_actions.ts
  등 호출부 전수 조사). 한 곳만 바꾸면 FR-004가 전 경로에 적용된다.
  `redirect_to`·초대 링크 경로는 이 함수에 도달하기 전에 분기하므로
  FR-010(기존 동작 유지)이 자동으로 성립한다.
- **Alternatives considered**:
  - 각 진입 지점(login/signup/root)마다 분기 — 호출부가 7곳이라 누락·중복 위험.
  - 서버가 리다이렉트 결정 — 서버는 webapp 라우팅을 모른다. 판정에 필요한 값
    (preference·team)이 이미 클라이언트 스토어에 있다.
- **보드의 팀 동기화**: 보드 플러그인은 `currentTeamId` 변경을 구독해
  `/boards/team/{teamId}`로 스스로 이동한다(플러그인 저장소에서 확인).
  `redirectUserToDefaultTeam`은 push 전에 팀을 확정하므로 `/boards`로만 보내도
  올바른 팀의 보드가 열린다.

## D4. 플러그인 초기화 타이밍

- **Decision**: 판정 결과가 보드·플레이북일 때만 product 등록 완료를 기다린다.
  가용성 기준은 manifest가 아니라 **등록된 product**(`selectProducts`,
  `state.plugins.components.Product`)다. `root.tsx`의 `initializeProducts`·
  `initializePlugins` Promise를 리다이렉트 경로에서 기다릴 수 있게 배선하고,
  상한 5초를 두어 초과 시 다음 우선순위(최종 채널)로 보낸다. 저장값은 바꾸지
  않는다.
- **Rationale**: `root.tsx:107-113`에서 플러그인 초기화와 `/` 리다이렉트가 병렬로
  실행되어, 판정 시점에 product가 아직 없을 수 있다. 더 중요한 함정: product
  라우트는 등록된 product로만 렌더되므로(root.tsx:444-470), manifest만 보고
  `/boards`로 push하면 Switch의 fallback(`root_redirect`)이 다시
  `redirectUserToDefaultTeam`을 호출해 채널로 튕긴다. 등록 완료를 기다려야
  이 되튕김이 없다.
- **Alternatives considered**:
  - manifest(`Client4.getWebappPlugins`) 로드만 대기 — 위 되튕김을 못 막는다.
  - 무조건 전체 초기화 대기 — 설정 없는 다수 사용자의 로그인까지 늦춘다.
    채널 판정이면 기다리지 않는 현재 결정이 Performance Goals(추가 지연 0)를
    지킨다.

## D5. 설정 UI 위치와 패턴

- **Decision**:
  - 개인: 설정 → 디스플레이 탭에 신규 섹션 `landing_product/`. 라디오(팀 기본값
    따르기/채널/보드/플레이북) + "모든 팀에 적용" 체크박스. `createSection`은
    라디오 2~3개 전용이라 쓰지 않고, 독립 서브컴포넌트 선례
    (`limit_visible_gms_dms`, `manage_languages`)를 따른다. 저장은
    `savePreferences` 직접 호출.
  - 팀: 팀 설정 모달 → 정보 탭에 신규 섹션 `team_landing_section.tsx`
    (`team_name_section` 선례). 로컬 state + `SaveChangesPanel` 일괄 저장,
    `actions.patchTeam({id, landing_product})`.
- **Rationale**: 두 모달 다 섹션 추가 패턴이 확립되어 있고, 팀 설정 모달 진입
  자체가 `MANAGE_TEAM` 권한으로 가드되어(sidebar_team_menu.tsx:59) FR-003의 권한
  요구가 UI·서버 양쪽에서 기존 메커니즘으로 집행된다.
- **Alternatives considered**: 시스템 콘솔 — 팀 관리자가 아니라 시스템 관리자
  영역이라 요구와 다르다. 사이드바 컨텍스트 메뉴 — 발견성이 낮고 선례가 없다.
- **노출 규칙(FR-007)**: 두 UI 모두 `useGetPluginsActivationState`로 활성 제품만
  선택지로 그린다. 저장값이 비활성 제품이면 선택 상태는 유효 동작 기준으로
  표시하되 저장값은 사용자가 새로 저장할 때만 바뀐다.

## D6. DB 마이그레이션 번호·엔진

- **Decision**: `postgres/000235_add_teams_landing_product.{up,down}.sql` +
  `migrations.list` 2줄. MySQL 쪽은 추가하지 않는다.
- **Rationale**: postgres 최신이 000234이고, mysql 디렉터리는 000153 이후
  동결 상태다(migrations.list 최근 항목이 전부 postgres). 선례:
  `000086_add_cloud_limits_archived`(단일 컬럼 ALTER). 마이그레이션 디렉터리는
  CODEOWNERS 보호 경로이므로 PR 설명에 변경을 명시한다.

## D7. 테스트 전략 (원칙 I·III 적용)

- **Decision**:
  - server: `team_test.go`(Patch·IsValid에 LandingProduct 검증), storetest
    왕복(Save/Update/Get) — 구현 전 실패 출력 확보.
  - webapp: 판정 셀렉터 단위 테스트(우선순위 4단계 × 가용성 매트릭스),
    `redirectUserToDefaultTeam` 분기 테스트(기존 테스트 파일 확장), 설정 UI
    렌더·저장 테스트.
  - 기준선: 구현 시작 전 `make test-server`·`npm run test` 실패 목록 저장,
    마감 때 diff로 회귀 0건(SC-004) 증명.
- **Rationale**: 로그인 공통 경로를 건드리므로 "미설정 사용자 불변"이 가장 값진
  테스트다. 판정을 셀렉터로 분리한 것도 이 테스트를 싸게 만들기 위해서다.
