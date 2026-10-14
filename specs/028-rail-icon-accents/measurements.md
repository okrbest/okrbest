# 실측 기록: 레일 제품 아이콘 액센트 색상 상태

## v2 — 2차 색 확정 실측 (2026-10-14, 최종)

사용자 피드백("배경색 느낌이 완전 다르다")으로 색을 레퍼런스 실측값으로
교체한 뒤 재검증했다 (research R2-v3). 아래 v1 기록은 폐기된 색 기준이다.

| 항목 | 실측값 | 판정 |
|---|---|---|
| 비선택 배경 | `rgb(8, 102, 255)`(#0866FF) 솔리드, 흰 아이콘 — 보드·플레이북 2버튼 | ✅ |
| 선택 배경 | `rgb(79, 70, 229)`(#4F46E5) 솔리드, 흰 아이콘 — 채널 | ✅ |
| 다크 모드 | 동일 색 유지(공용 고정값), 어두운 레일과 또렷이 구분 | ✅ |
| 대비 | 흰색 대 #0866FF 4.82:1, #075EEB(hover) 5.51:1, #4F46E5 6.29:1 | ✅ AA |
| 게이트 | `_team-sidebar.scss` stylelint exit 0, team_sidebar+utils Jest 46/46 | ✅ |
| 스크린샷 | `screenshots/v2-light-rail.png`, `screenshots/v2-dark-rail.png` | — |

치수·구조(36 알약·radius 8·글리프 28·stroke 0.6/0.8·라벨 600/700)는 v1
실측에서 변경 없음. Onyx SCSS 분기는 제거(공용색) — `data-theme-type` 훅은
기반 시설로 유지.

---

## v1 — 1차 실측 (폐기된 색 기준, 기록 보존)

**Date**: 2026-10-14 | **환경**: 로컬 dev 서버(`make run`, webpack watch),
Playwright(Chromium), 계정 `sc028-viewer`, 팀 `teamtest`.

**플러그인 복구 (검증 중 조치)**: 보드(focalboard 9.2.4)·플레이북
(playbooks 0.0.0+755bf25a)은 서버에 ACTIVE였지만 webapp 번들이
`/static/plugins/...bundle.js` 404로 로드되지 않아 레일에 버튼이 없었다.
원인 — webpack이 `server/client/`를 다시 쓰면서 서버가 활성화 때 복사해 둔
`server/client/plugins/`가 사라짐. 로컬 소켓으로 세 플러그인을
비활성→재활성해 번들을 재생성했고(코드 변경 없음), 이후 레일에 채널·보드·
플레이북 3버튼이 표시됐다. 초기 계측(아래 "단일 버튼 계측")은 active 클래스
토글로 비선택 상태를 근사했고, 복구 후 실제 3버튼으로 재계측해 모두 일치를
확인했다.

계측 방법: quickstart.md 스니펫(getComputedStyle / getBoundingClientRect).
비선택 상태는 같은 요소에서 `active` 클래스를 제거해 계측(전환 애니메이션
완료 대기 400ms 후 판독), 계측 후 원복.

## SC 판정

| SC | 실측값 | 기준 | 판정 |
|---|---|---|---|
| SC-001 | 선택 알약 `rgb(40, 66, 123)`(#28427B) + 아이콘 `rgb(255,255,255)`, 비선택 `rgba(18, 100, 163, 0.14)` — 스크린샷 `screenshots/sc001-light-rail.png` | 인디고 솔리드 + 흰 아이콘, 파랑 틴트 | ✅ |
| SC-002 | 다크 전환 직후(새로고침 없음) `data-theme-type="Onyx"`, 선택 알약 `rgb(50, 83, 154)`(#32539A) — 스크린샷 `screenshots/sc002-dark-rail.png` | 밝은 인디고로 즉시 전환 | ✅ |
| SC-003 | 흰색 대 #28427B = **9.74:1**, 흰색 대 #32539A = **7.40:1** (WCAG 공식으로 실측 색값 계산) | ≥ 4.5:1 | ✅ |
| SC-004 | 플러그인 복구 후 실제 클릭으로 실행: 보드 버튼 클릭 1회 → focalboard 알약이 `rgb(40,66,123)` 솔리드+흰 아이콘, 채널·플레이북은 `rgba(18,100,163,0.14)` 틴트로 복귀. 채널 클릭으로 왕복 확인. 다크에서도 동일(보드 `rgb(50,83,154)`, 틴트 `rgba(60,102,196,0.14)`) — 스크린샷 `sc004-light-boards-active.png`, `sc002-dark-boards-active.png` | 클릭 1회 즉시 이동 | ✅ |
| SC-005 | svg `28×28`, 알약 `36×36` → 비율 77.8% | 글리프 28px(≈78%) | ✅ |

## FR 추가 확인

| 항목 | 실측값 |
|---|---|
| FR-003 radius | `border-radius: 8px` |
| FR-005 반투명 제거 | 버튼 `opacity: 1`, 라벨 색 `rgb(71,70,71)`(기존 sidebar text — 아이콘 색이 라벨로 새지 않음) |
| FR-006 hover | 실포인터 hover 시 `rgba(18, 100, 163, 0.2)` |
| FR-006 focus | `element.focus()` 시 동일 틴트 `rgba(18, 100, 163, 0.2)`. 포커스 링은 앱 공용 a11y 시스템(a11y--focused) 소관 — 이 변경은 배경만 건드려 가리지 않음 |
| FR-004 획 | 비선택 stroke-width 0.6px, 선택 0.8px |
| FR-007 라벨 | 비선택 600, 선택 700 |
| FR-008 테마 즉시 반영 | 토글 클릭만으로 dataset·색 전환 (라이트↔다크 왕복 확인) |
| FR-010 범위 밖 불변 | `git diff master`: SCSS 변경이 rail-product 블록(149~220행)과 신규 Onyx 블록(349~363행)에 한정. 팀 버튼·테마 토글·`.fa`·team-wrapper 불변. 스크린샷에서도 팀 버튼·토글 표시 동일 |
| 다크 비선택 | 틴트 `rgba(60, 102, 196, 0.14)`(#3C66C4), 아이콘 `rgb(93, 137, 234)`(#5D89EA) — research R2 표와 일치 |

## 3버튼 재계측 (플러그인 복구 후, 라이트)

| 버튼 | active | 배경 | 아이콘 색 | svg | stroke | 라벨 |
|---|---|---|---|---|---|---|
| railProduct-channels | ✓ | rgb(40,66,123) | rgb(255,255,255) | 28×28 | 0.8px | 700 |
| railProduct-focalboard | — | rgba(18,100,163,0.14) | rgb(18,100,163) | 28×28 | 0.6px | 600 |
| railProduct-playbooks | — | rgba(18,100,163,0.14) | rgb(18,100,163) | 28×28 | 0.6px | 600 |

다크(Onyx) 재계측: 선택 rgb(50,83,154)+흰색, 비선택 rgba(60,102,196,0.14)+
rgb(93,137,234) — data-model.md 표와 전부 일치.

참고 — 플레이북 제품 화면에서는 레일 자체가 숨겨진다(제품 등록값
`showTeamSidebar=false`, 기존 동작·범위 밖). 솔리드 이동 확인은 보드로 했다.

## 검증 중 정리 사항

- 검증 계정 `sc028-viewer`(sc028-viewer@example.com)를 로컬 소켓으로 생성해
  `teamtest` 팀에 넣었다. 온보딩 오버레이는 계측을 위해 페이지 DOM에서만
  제거(서버 상태 불변). 테마 설정은 라이트로 원복.
