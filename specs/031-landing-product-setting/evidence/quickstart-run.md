# Quickstart 실주행 기록 (2026-10-25, 브랜치 031-landing-product-setting)

실행 환경 — 로컬 dev 서버(브랜치 빌드, `make run-server-pgvector` + server/.env DSN),
webapp `npm run run`(webpack watch) 번들, Playwright 브라우저 자동화.
검증 계정: landing-admin(lp-team-a 팀 관리자), landing-user(lp-team-a·b 소속),
landing-fresh(lp-team-a 소속, 무설정).

## 환경 특이사항

- **플레이북 webapp 플러그인은 이 dev 환경에서 자체 초기화에 실패한다**
  (콘솔: "Unable to initialize plugin playbooks, version 0.0.0+755bf25a" —
  우리 변경과 무관한 기존 결함). 따라서 제품 시나리오는 전부 보드로 수행했고,
  플레이북 선택지가 UI에 나타나지 않는 것 자체가 FR-007(활성 제품만 노출)의
  정상 동작이다.
- 첫 페이지 로드에서 보드·플레이북 번들 404 → 메모리에 기록된 알려진 함정
  (webpack 재빌드가 plugins 서빙을 깨뜨림). 플러그인 비활성→활성 재토글로 복구.
- `/landing` 경로가 데스크톱 앱 안내용으로 예약돼 있어 팀 URL `landing-*`를
  쓸 수 없다 (lp-team-*로 생성).

## 시나리오 결과

| # | 시나리오 | 결과 | 증거 |
|---|---|---|---|
| 1 | US1 개인 설정(공통 보드) 후 재로그인 | **통과** — 추가 클릭 0회로 `/boards/team/47imo...` 도착 | s1-boards-landing.png, preferences 행 `(landing_product, '', boards)` |
| 1-보강 | 개인 명시 채널 > 팀 기본값 보드 | **통과** — 공통 채널 저장 후 재로그인 → `/lp-team-a/channels/town-square` | preferences `('', channels)` + teams.landingproduct=boards 공존 상태에서 채널 도착 |
| 2 | US2 팀 기본값(보드) → 무설정 구성원 | **통과** — landing-fresh 재로그인 → `/boards/team/...` | patchTeam 경유 `teams.landingproduct='boards'` DB 확인 |
| 2-권한 | 일반 구성원의 팀 설정 접근 | **통과** — landing-fresh 팀 메뉴에 "팀 설정" 항목 없음("멤버 보기"만), 관리자에겐 노출 | 메뉴 항목 목록 캡처(세션 로그) |
| 3 | US3 팀별(A=보드) + 공통(채널) | **통과** — 마지막 팀 A 재로그인 → `/boards`, 마지막 팀 B 재로그인 → `/lp-team-b/channels/town-square` | preferences 2행(name=팀A ID boards / name='' channels) |
| 4 | 플러그인 비활성·재설치 (SC-003) | **통과** — focalboard 비활성 후 재로그인 → 채널(오류 없음), 설정 UI에 보드 선택지 미노출, 저장값(teams·preferences) 불변. 재활성화 후 재로그인 → 추가 설정 0회로 `/boards` 복원 | 비활성 중 DB 조회: landingproduct=boards·preference 2행 유지 |
| 5-1 | 무설정 사용자 기존 동작 | **통과** — landing-user·admin·fresh 모두 설정 전 첫 로그인은 채널(town-square) 도착 | 세션 로그 |
| 5-2 | redirect_to 불변 (FR-010) | **통과** — 팀 기본값 보드인 landing-fresh가 `?redirect_to=/lp-team-a/channels/off-topic`로 로그인 → 지정 주소 도착(보드 아님) | URL 확인 |
| 5-3 | 팀 전환 시 제품 유지 (FR-009) | **통과** — `/boards/team/{A}`에서 팀 B 전환 → `/boards/team/{B}` (보드 유지) | URL 확인 |

## SC 실측

| SC | 기준 | 실측 |
|---|---|---|
| SC-001 | 설정 사용자 로그인 후 추가 클릭 0회로 해당 화면 도착 | **통과** — 로그인 제출 직후 `/boards/...` 도착, 추가 조작 0회 (시나리오 1·2·3·4 공통) |
| SC-002 | 설정 변경을 1분 안에 완료 | **통과** — 계정 메뉴→설정→화면 탭→첫 화면 편집→라디오→저장 = 조작 6회, 자동화 기준 약 15초 |
| SC-003 | 재활성화 후 추가 설정 0회로 원복 | **통과** — 시나리오 4: 플러그인 enable 외 어떤 조작도 없이 다음 로그인부터 보드 복원 |
| SC-004 | 미설정 사용자·팀 로그인 동작 불변 | **통과** — 시나리오 5-1~5-3 + jest 회귀(global_actions 기존 10건, 기준선 대비 신규 실패 0건) |

## 품질 게이트 (기준선 diff)

- server: `make check-style` 0 issues, `go test -count=1 ./public/model/` ok,
  `go test -count=1 -run TestTeamStore ./channels/store/sqlstore/` ok,
  `make i18n-check` exit 0, public `go mod tidy` 클린 —
  기준선(baseline-server.md)과 동일. [final-gates-server.md](final-gates-server.md)
- webapp: lint 기준선 대비 실질 diff 0건(기존 오류 1건의 줄번호만 +1 밀림 —
  같은 파일·같은 규칙·같은 메시지), ts diff 0건, 접촉 영역 jest
  813건 중 806 통과·7 실패는 기준선에 있던 src/selectors 기존 실패와 동일.
  [final-gates-webapp.md](final-gates-webapp.md)
- `make mocks` 불필요(스토어 인터페이스 변화 없음 — 컬럼만 추가).

## RED 증거

- webapp: [red-webapp.md](red-webapp.md) — 셀렉터·장벽·리다이렉트·개인 설정 UI·
  팀 설정 UI·팀별 저장 각 단계의 구현 전 실패 출력.
- server: [red-server.md](red-server.md) — 모델(컴파일 실패), 스토어 왕복
  (Get에서 boards→'' 소실 diff).
