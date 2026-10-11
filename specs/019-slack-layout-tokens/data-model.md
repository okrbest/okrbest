# 데이터 모델: 레이아웃 토큰 기준표

코드로 들어갈 값의 정의다. 실측 기록은 [measurements.md](measurements.md),
채택 규칙은 research R1(실측 우선). 2026-10-11 실측으로 확정 완료 —
`보간`은 실측 지점이 없어 4px 그리드 보간으로 둔 단계다(후속 영역에서 실측
지점이 생기면 근거를 갱신한다).

## 1. 간격 — `--okr-space-*`

4px 그리드. 등록 없는 비그리드 간격 금지 (FR-009).

| 토큰 | 값 | 용도 | 근거 (measurements.md) | 상태 |
|---|---|---|---|---|
| `--okr-space-1` | 4px | 아이콘↔글자 사이, 헤더 인접 요소 gap | Slack view-header gap 4 실측 | 확정 |
| `--okr-space-2` | 8px | 형제 버튼 사이, 행 내부 좌우 소여백 | Slack 사이드바 행 padR 8·gap 8, 메시지 상하 8 실측; WCAG 인접 타깃 8px | 확정 |
| `--okr-space-3` | 12px | 패널·헤더 우측 패딩, 검색창 좌 패딩 | Slack 헤더 padR 12, 검색 padL 12 실측 | 확정 |
| `--okr-space-4` | 16px | 섹션 내부 패딩 (중간 단계) | 실측 지점 없음 — 그리드 보간 | 보간 |
| `--okr-space-5` | 20px | 본문 콘텐츠 좌우 패딩 | Slack 메시지 거터 좌우 20 실측 | 확정 |
| `--okr-space-6` | 24px | 메뉴 행 좌우 패딩, 사이드바 들여쓰기 | Slack 메뉴 행 pad 0 24, 사이드바 padL 24 실측 | 확정 |
| `--okr-space-7` | 32px | 큰 구획 사이 | 실측 지점 없음 — 그리드 보간 | 보간 |

## 2. 아이콘 크기 — `--okr-icon-*`

Slack 실측의 양대 축은 16/20 (svg 분포 16×24개·20×20개).

| 토큰 | 값 | 용도 | 근거 | 상태 |
|---|---|---|---|---|
| `--okr-icon-inline` | 14px | 글줄 안 장식(탭 라벨 앞 등) | MM 018 탭 실사용 14 (Slack 소수 15 — 차이 기록) | 확정 |
| `--okr-icon-aux` | 16px | 보조 표시, 사이드바 채널 아이콘 | Slack 사이드바 아이콘 16 + svg 최빈 실측 | 확정 |
| `--okr-icon-toolbar` | 18px | 툴바 글리프 (MM compass 관례) | MM 관례 18 (Slack 소수 18 존재) | 확정 |
| `--okr-icon-main` | 20px | 헤더 버튼 글리프, 주요 단독 아이콘 | Slack 헤더 버튼 글리프 20 실측 | 확정 |

## 3. 버튼 타깃 — `--okr-target-*`

| 토큰 | 값 | 용도 | 근거 | 상태 |
|---|---|---|---|---|
| `--okr-target-s` | 24px | 밀집 구역 보조 버튼 하한 | WCAG 2.2 AA 웹 타깃 최소 24 + MM btn-xs | 확정 |
| `--okr-target-m` | 28px | 목록 행·헤더 안 버튼 | Slack 헤더 버튼 28×28 실측 | 확정 |
| `--okr-target-l` | 32px | 헤더·툴바 표준 버튼 | MM btn-sm·018 통일 결과 32 | 확정 |

## 4. 행 높이 — `--okr-row-*`

Slack의 만능 행 높이는 28이다 (사이드바 행·메뉴 행·헤더 버튼·검색창 전부).

| 토큰 | 값 | 용도 | 근거 | 상태 |
|---|---|---|---|---|
| `--okr-row-sidebar` | 28px | 사이드바 채널 행 | Slack 실측 28 | 확정 |
| `--okr-row-menu` | 28px | 드롭다운 메뉴 행 | Slack 메뉴 행 28 실측 (후보 32에서 수정) | 확정 |
| `--okr-row-input` | 28px | 검색창·소형 입력 높이 | Slack 상단 검색 28 실측 (후보 40에서 수정) | 확정 |

헤더류 높이(Slack 채널 헤더 49 등)는 ②헤더·툴바 기능에서 이 표를 소비하며
확정한다.

## 5. 보강 radius — `--okr-radius-ms`

| 토큰 | 값 | 용도 | 근거 | 상태 |
|---|---|---|---|---|
| `--okr-radius-ms` | 6px | 목록 행·중간 카드 모서리 (upstream s=4, m=8 사이) | Figma 킷 radius_medium 6 + Slack 사이드바 행 radius 6 실측 | 확정 |

upstream `--radius-*` 체계는 손대지 않는다 — 빠진 6px 한 단계만 보탠다.

## 6. 아이콘↔폰트 균형표 (US1 AC2의 정본)

| 글자 크기 (014 스케일) | 인라인 아이콘 | 버튼 글리프 → 타깃 | 근거 |
|---|---|---|---|
| 12px (micro) | 14 (`inline`) | 14 → 24 (`target-s`) | MM 018 관례 + WCAG 타깃 하한 |
| 13px (caption) | 16 (`aux`) | 16 → 28 (`target-m`) | svg 최빈 16 실측 |
| 15px (base) | 16 (`aux`) | 20 → 28~32 (`target-m/l`) | Slack 사이드바 15글자+16아이콘, 헤더 28버튼+20글리프 실측 (후보 "15→18"에서 수정) |
| 18px (subtitle) | 20 (`main`) | 20 → 32 (`target-l`) | Slack 헤더 제목 18 + 글리프 20 실측 |

사용 절차·예외는 usage-guide.md(T014)가 서술한다 — 값의 정본은 이 표다.

## 7. 예외 목록 (비그리드 허용값)

| 값 | 용도 | 비고 |
|---|---|---|
| 1px | 구분선, 테두리 | 그리드 미적용 대상 |
| 2px | 포커스 링, 활성 인디케이터, 아바타 테두리 | 〃 |
| 50% / 9999px | 원형·알약 | 형태 표현 — 길이 아님 |
| 6px·7px (radius) | 기존 okrbest 모서리 | radius는 간격 그리드 대상 아님 — 6은 `--okr-radius-ms`로 토큰화, 7px 1곳은 무변화 원칙상 예외 유지(②에서 재결정) |

구현 중 치환 전수 조사에서 새 예외가 나오면 용도와 함께 이 표에 추가한다.
용도 없는 값은 예외로 등록할 수 없다.

## 8. 치환 대상 목록 (T009가 전수 확정)

조사 범위: `sass/okrbest/*.scss`, `channel_header_tabs.scss`,
`channel_member_stack.scss`, `channel_bookmarks_rhs.scss` + grep 스캔 추가
발견분. 알려진 선발대 (figma-token-audit.md 4절):

| 위치 | 현재 값 | 대응 토큰(예정) |
|---|---|---|
| `_overrides.scss:116` | `border-radius: 7px` | 예외 유지 (7절) |
| `_overrides.scss:132` | `border-radius: 6px` | `--okr-radius-ms` |
| `_overrides.scss:188` | `border-radius: 6px` | `--okr-radius-ms` |

전수 목록은 T009가 채우고, 항목마다 치환 후 실측 결과를 붙인다.
