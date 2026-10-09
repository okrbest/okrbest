# Contract: 채널 헤더 UI 동작 계약

**Date**: 2026-10-09 | **Plan**: [../plan.md](../plan.md) | **Spec**: [../spec.md](../spec.md)

서버 API 변경이 없으므로 계약은 UI 동작으로 정의한다.

## 탭 줄 (채널명 줄 아래)

| 탭 | 노출 조건 | 클릭 | 활성 조건 |
|---|---|---|---|
| 메시지 | 항상 | 열린 파일·고정 RHS 닫기 (닫혀 있으면 no-op) | RHS 닫힘 |
| 파일 | 항상 | 채널 파일 RHS 토글 (기존 showChannelFiles 경로) | rhsState=CHANNEL_FILES |
| 북마크 | 북마크 기능 켜짐 | 접기 preference 토글 (바 펼침↔접힘) | 바 펼침 상태 |
| 고정 | 항상 | 고정 RHS 토글 (기존 showPinnedPosts 경로) | rhsState=PIN |

- 고정 탭 배지 = 고정 개수 (0이면 배지 없음). 활성 표시는 하단 표시선+색
  (014 체계 — 반전/굵기, 색만으로 구분하지 않음).
- 스레드·검색 등 다른 패널이 열려 있으면 어떤 탭도 활성 아님.
- 접근성: 탭 줄은 tablist/tab 시맨틱 + aria-selected(또는 aria-current),
  각 탭은 가시 라벨.

## 헤더 우측 (왼→오)

| 요소 | 동작 | 상태 표시 |
|---|---|---|
| 멤버 아바타 스택 | 클릭 → 기존 멤버 RHS 토글 | 겹친 아바타 ≤3 + 전체 인원수. 보류 가입 요청 등 기존 뱃지 유지. rhsState=CHANNEL_MEMBERS면 활성 |
| 알림벨 | 클릭 → 채널 뮤트 토글 (기존 notify props 경로) | 뮤트면 빗금 벨 + aria에 상태 포함 |
| ⋮ 더보기 | 클릭 → 기존 채널 메뉴 오픈 (채널명 ▾와 동일 메뉴) | — |

- 기존 파일·고정 아이콘 버튼은 제거된다. 멤버 아이콘+숫자는 스택으로 대체.
- 즐겨찾기(☆)·채널명 ▾·설명 등 좌측 기존 요소는 변경 없음.
- DM/GM: 스택은 상대/구성원 아바타, 기존 DM 특수 표시 유지(FR-009).

## 북마크 바

- 접기 preference(`channel_bookmarks_bar` / 채널 ID / `collapsed`)가 있으면
  바를 렌더하지 않는다. 행이 없으면 기존처럼 렌더.
- 바의 기존 기능(항목 추가·정렬·메뉴)은 변경 없음.

## i18n (신규 키, en/ko 동시)

탭 라벨: 메시지/Messages · 파일/Files · 북마크/Bookmarks · 고정/Pinned.
벨: "채널 알림 끄기(켜기)" aria + 툴팁. 스택: "멤버 {count}명 보기" aria.
정확한 키 이름은 구현 시 `channel_header.tabs.*` 계열로 확정.
