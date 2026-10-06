# UI 계약: 읽지 않은 항목 모아보기

이 기능이 바깥에 노출하는 면은 (1) 라우트, (2) 사이드바 메뉴, (3) 화면 상호작용,
(4) 기존 서버 API 소비뿐이다. **신규 서버 API·websocket 이벤트·저장소는 없다.**

## 1. 라우트 계약

| 항목 | 값 |
|---|---|
| 경로 | `/:team/unreads` |
| 등록 | `center_channel.tsx`의 Switch (threads·drafts와 같은 자리) |
| 전제 | `root.tsx` `doesRouteBelongToTeamControllerRoutes` 정규식에 `unreads` 포함 |
| 복원 | 마지막 화면 복원(`PreviousViewedTypes`) 대상 아님 — Drafts와 동일 정책 |
| LHS | `LhsPage.Unreads`. 진입 시 `selectLhsItem(Page, Unreads)` + RHS 억제 |

## 2. 사이드바 메뉴 계약

| 항목 | 값 |
|---|---|
| 위치 | static 영역 최상단 (GlobalThreadsLink 위) |
| 표시 | 항상 (FR-001). Drafts처럼 숨기지 않는다 |
| 배지 | `ChannelMentionBadge` + 현재 팀 읽지 않음 상태(`getUnreadStatusInCurrentTeam`) |
| 활성 판정 | `matchPath(pathname, '/:team/unreads')` |
| 키보드 | `getVisibleStaticPages`에 편입 → Alt+↑/↓ 이동 (FR-011) |
| 스타일 | 링크 마크업은 `SidebarChannel`/`SidebarLink` 관례, 추가 선언은 `_overrides.scss` |

## 3. 화면 상호작용 계약 (FR 대응)

| FR | 상호작용 | 소비하는 기존 구현 |
|---|---|---|
| FR-003 | 채널별 그룹, 멘션 우선 → 최근 활동순 | `getUnreadChannels` + `sortUnreadChannels` |
| FR-004 | 그룹 머리글(유형 구별 + 채널 이동) | `DraftTitle`, `history.push(channelUrl)` |
| FR-005 | `last_viewed_at` 이후 본문 표시 | posts store + `loadUnreads` 보충 |
| FR-006 | 메시지 호버 액션(반응·스레드·저장) | `PostComponent location=SEARCH` |
| FR-007 | 자동 읽음 금지 | `PostList` 미사용으로 구조적으로 보장 |
| FR-008 | 그룹 "읽음으로 표시" → 제거 + 배지 갱신 | `readMultipleChannels([id])` + websocket 전파 |
| FR-009 | "모든 메시지 읽음으로 표시" | `readMultipleChannels(모든 그룹 id)` |
| FR-010 | 포커스 그룹에서 Esc → 그 그룹 읽음 | 위와 동일 액션 |
| FR-012 | 그룹 접기/펼치기 | 로컬 상태, 머리글 토글 |
| FR-013 | 새 항목 배너 → 클릭 시 갱신 | 스냅샷 재고정 (data-model) |
| FR-014 | 빈 상태 안내 | `NoResultsIndicator` 관례 |
| FR-017 | en/ko 동시 제공 | `i18n/{en,ko}.json` 같은 변경 |

## 4. 소비하는 서버 API (전부 기존)

| API | 용도 |
|---|---|
| `GET /users/{uid}/channels/{cid}/posts/unread` (`Client4.getPostsUnread`) | 그룹 본문 보충 적재 |
| `POST /channels/members/me/mark_read` (`Client4.readMultipleChannels`) | 그룹/전체/Esc 읽음 처리 |
| websocket `MultipleChannelsViewed` | 타 기기 읽음 반영 (기존 핸들러 그대로) |

## 5. upstream 접촉 지점 (research 결정 10의 계약화)

아래 7곳 외 upstream 파일을 수정하지 않는다. 수정은 전부 삽입이며, 완료 시
`docs/upstream-adapted-divergences.md`에 기록한다.

1. `center_channel.tsx` — Route 삽입
2. `root.tsx` — 라우트 정규식에 `unreads`
3. `sidebar_list.tsx` — 링크 삽입
4. `types/store/lhs.ts` + `selectors/lhs.ts` — enum·정적 페이지 항목
5. `unreads_status_handler` — 탭 제목 분기
6. `mobile_channel_header` — 제목 분기
7. `sidebar_mentions_link`·`sidebar_saved_posts_link` — `matchPath` 보완

## 6. 바꾸지 않는 것 (FR-016)

- 사이드바 UNREADS 카테고리(`unread_channels.tsx`), 설정 토글
  (`show_unreads_category`), 서버 설정 `ExperimentalGroupUnreadChannels`와
  그 기본값(`disabled`) — 전부 무변경.
- 운영 서버 설정값 확인은 quickstart의 배포 점검 항목으로 수행한다.
