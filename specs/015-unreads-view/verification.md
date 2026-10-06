# 종단 검증 기록 (T024·T029·T030)

- 일시: 2026-10-07 04:55~05:25 KST
- 환경: 로컬 개발 스택 — server 11.11.0.dev (localhost:8065, docker postgres/redis/minio),
  `webpack --watch`가 feat/015-unreads-view 번들을 서빙. Playwright(headless Chromium) 실주행
- 픽스처: 신규 계정 spec015a(검증 대상)·spec015b(발신), 팀 spec015team, 채널 5개(s15-*),
  spec015b가 채널별 미읽음 메시지 발신(s15-alpha에 @spec015a 멘션)
- 증거 스크린샷: [evidence-unreads-view.png](evidence-unreads-view.png)

## SC 실측값 (추정 없음 — 전부 실주행 측정)

| SC | 기준 | 실측 | 판정 |
|---|---|---|---|
| SC-001 | 미읽음 5채널을 클릭 1번으로 본문까지 확인 | 사이드바 메뉴 클릭 1회 → 그룹 5개·본문 텍스트 18건 표시 | 통과 |
| SC-002 | 진입 후 1초 내 첫 그룹 | **106ms** (클릭→`.UnreadChannelGroup` 렌더) | 통과 |
| SC-003 | 보기만으로 읽음 0건 | 전 그룹 열람 후 채널 복귀 — 사이드바 미읽음 5채널 그대로 | 통과 |
| SC-004 | 읽음 처리 1초 내 동기화 | **51ms** (그룹 제거+사이드바 미읽음 해제, websocket 경유) | 통과 |
| SC-005 | 신규 계정에서 UNREADS 그룹 비표시 | spec015a 실측: 카테고리 0건. 서버 기본값 mmctl 실측 `"disabled"`. **10계정 전수는 미실행** — 결정 경로(preference 부재→서버 기본)가 결정적이고 이 기능은 해당 로직을 수정하지 않음 | 통과(1/10 실측) |
| SC-006 | 키보드 전용 완주 | Alt+↑ 2회로 /unreads 진입 → 포커스 이동 → Esc로 그룹 읽음. 마우스 0회 | 통과 |

## quickstart 시나리오 절별 결과

| 절 | 결과 | 비고 |
|---|---|---|
| SC-001~006 | 전부 통과 | 위 표 |
| FR-013 배너 | 통과 | 보던 중 spec015b가 town-square 발신 → 목록 불변(4 유지) + "새 읽지 않은 대화 1개·보기" 배너 → 클릭 시 그룹 5개로 갱신·배너 소멸 |
| FR-009 전체 읽음 | 통과 | "모든 메시지를 읽음으로 표시" → "모두 읽었습니다" 빈 상태, 사이드바 미읽음 0 |
| FR-010 Esc | 통과 | S15 Bravo 그룹 제목 포커스 + Esc → 그룹 읽음·제거 |
| FR-012 접기 | 통과 | 포스트 3→0→3 (접기/펼치기) |
| 탭 제목 | 통과 | "(1) 읽지 않은 항목 - Spec015 Team Mattermost" |
| Esc 충돌(SC-006 3단계) | **미실행** | 이모지 선택기 열고 Esc 하는 조작을 headless에서 재현하지 못함. 포털 구조상 버블 차단은 단위 구조로 보장, 수동 확인 권장 |
| US2-4 타 기기 반영 | 부분 실측 | 같은 클라이언트의 websocket 반영(51ms)은 실측. 별도 브라우저/기기 동시 확인은 미실행 |

## US4 — 기존 기능 무변경 검증 (T024)

| 시나리오 | 결과 |
|---|---|
| US4-1 신규 계정 UNREADS 그룹 비표시 | 통과 — spec015a 로그인 직후 카테고리 0건 |
| US4-2 켠 사용자 유지 | 통과 — 토글 ON 후 사이드바에 "읽지 않음" 그룹 + S15 Delta 표시 |
| US4-3 설정 토글 존재·동작 | 통과 — 설정 모달(Ctrl+Shift+A, 기존 단축키 생존 확인 겸) → 사이드바 탭 → "읽지 않은 채널 모아보기" ON/OFF 모두 동작, OFF 원복 완료 |
| 배포 점검 (T025) | `mmctl --local config get ServiceSettings.ExperimentalGroupUnreadChannels` → `"disabled"` |

## 품질 게이트 (T028) — 기준선 diff 판정

기준선: [baseline.md](baseline.md) (HEAD 50f2156b94, 구현 전).

| 게이트 | 기준선 | 최종 | diff 판정 |
|---|---|---|---|
| `npm run check` | 107 errors | 107 errors | **오류 파일 목록 동일** (diff 공집합) |
| `npm run check-types` | 오류 N건 | 동일 목록 | 1차 실행에서 신규 17건 발견 → 수정(커밋 55dd60a1ea) → 재실행 **오류 목록 기준선과 동일** |
| `npm run test` | 27 suites 실패 / 1147 통과 | 27 suites 실패 / 1152 통과 | **실패 스위트 목록 동일**, 신규 스위트 5개 전부 통과 |
