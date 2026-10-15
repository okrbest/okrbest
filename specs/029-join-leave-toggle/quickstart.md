# Quickstart: 채널별 입장·퇴장 메시지 끄기 검증

기능이 끝까지 동작하는지 확인하는 실행 절차다. 구현 세부는 tasks.md에 둔다.
계약은 [contracts/channel-and-posts-api.md](contracts/channel-and-posts-api.md), 모델은 [data-model.md](data-model.md)를 본다.

## 준비

- Node 24로 전환한다(`source ~/.nvm/nvm.sh && nvm use 24`). v20이면 webapp 테스트가 로드에 실패한다.
- 로컬 Postgres 비밀번호는 `mostest_password`다.
- 서버를 띄우면 마이그레이션 `000221`이 적용됐는지 확인한다:
  ```bash
  psql -U mmuser -d mattermost_test -c "\d channels" | grep -i disablejoinleave
  ```
- 계정: 시스템 관리자 `sysadmin`, 일반 사용자 2명(A·B), 봇 1개. 공개 채널 `town-test` 하나.

## 시나리오 1 — 숨김과 복원 (US1·US2, SC-001·SC-002)

1. A가 `town-test`에 입장하고 퇴장했다가 다시 입장한다. 관리자가 B를 추가한다. 게스트가 있으면 게스트도 추가한다.
2. 관리자가 채널 설정 > Configuration에서 "Join/Leave System Messages" 토글을 끄고 저장한다.
3. 기대: 관리자·A·B 화면 모두에서 입장·퇴장·추가 메시지가 보이지 않는다. 일반 메시지는 그대로다.
4. API 확인:
   ```bash
   curl -s -H "Authorization: Bearer $TOKEN" "$URL/api/v4/channels/$CH/posts?per_page=200" \
     | jq '[.posts[] | select(.type | startswith("system_"))] | map(.type) | unique'
   ```
   기대: 멤버십 유형 12종이 하나도 없다.
5. 계정 설정 > 고급에서 "입장/퇴장 메시지 표시"를 켠 계정으로 채널을 연다. 기대: 그래도 보이지 않는다(FR-007).
6. 검색창에서 입장 메시지 문구(예: A의 사용자명)로 검색한다. 기대: 이 채널의 입장·퇴장 메시지가 결과에 없다(FR-006).
7. 토글을 다시 켜고 저장한다. 기대: 1단계에서 만든 메시지가 모두 원래 자리에 보인다.

## 시나리오 2 — 실시간 반영 (FR-011, SC-004)

1. B가 `town-test`를 열어 둔다.
2. 관리자가 다른 브라우저에서 토글을 바꾼다.
3. 기대: B 화면이 새로고침 없이 바뀐 설정대로 다시 그려진다. upstream에 이 동작의 자동 테스트가 없으므로 여기 결과가 유일한 증거다(tasks T034).
4. 게시물 응답의 `ETag`를 설정 변경 전후로 비교한다:
   ```bash
   curl -sI -H "Authorization: Bearer $TOKEN" "$URL/api/v4/channels/$CH/posts" | grep -i etag
   ```
   기대: 끝부분이 `.false`에서 `.true`로 바뀐다(FR-012, tasks T026).

## 시나리오 3 — 알림 (US3, SC-003)

1. 숨김 상태에서 A가 스스로 퇴장했다가 다시 입장한다. 기대: B에게 푸시·이메일·웹소켓 알림이 없다.
2. 관리자가 A를 내보냈다가 다시 추가한다. 기대: A만 "채널에 추가됨" 알림을 받는다. A의 알림 센터(포크 알림 히스토리)에 1건이 생기고, B의 알림 센터에는 없다.
3. 서버를 재시작해 캐시를 비운 직후, 한 번도 이 채널에 없던 사용자 C를 관리자가 추가한다. 기대: C가 알림을 받는다(FR-015, 추가된 사용자 프로필을 캐시 밖에서 읽는 경로, tasks T040).

## 시나리오 4 — 포크 필터와 함께 (US4, SC-005·SC-006)

1. 숨김 채널에서 사용자 필터로 A만 보이게 한다(`?filterUserIds=<A_ID>`). 기대: A의 일반 글만 보인다.
2. 봇 메시지 숨김(`showBotMessages=false`)을 켠다. 기대: 봇 글과 멤버십 메시지가 모두 빠진다.
3. 일반 글 1개 → 입장·퇴장 60개 → 일반 글 1개 순서로 채널을 만든다. 맨 아래에서 위로 끝까지 스크롤한다.
   기대: 같은 범위 요청이 반복되지 않고(브라우저 네트워크 탭에서 `posts?before=` 요청 수가 유한), 첫 일반 글까지 올라간 뒤 채널 시작 표시가 나온다.

## 시나리오 5 — DM·GM과 권한 (FR-002·FR-003)

```bash
curl -s -X PUT -H "Authorization: Bearer $TOKEN" -d '{"disable_join_leave_messages":true}' \
  "$URL/api/v4/channels/$GM_ID/patch" | jq .status_code     # 기대: 400
curl -s -X PUT -H "Authorization: Bearer $B_TOKEN" -d '{"disable_join_leave_messages":true}' \
  "$URL/api/v4/channels/$CH/patch" | jq .status_code       # 기대: 403 (B가 권한 없음일 때)
```

## 자동 테스트

```bash
cd server
go test ./public/model -run 'Channel|Post' -count=1
go test ./channels/app -run 'Membership|Notification|GetPosts|PostThread|Flagged|Permalink' -count=1
go test ./channels/api4 -run 'PatchChannel|GetPostsForChannel|GetPost' -count=1
go test ./channels/store/sqlstore -run 'TestPostStore' -count=1

cd ../webapp/channels
npm run test -- src/packages/mattermost-redux/src/reducers/entities/posts.test.ts \
  src/components/channel_settings_modal src/actions/websocket_actions.test.ts
```

## 게이트 (원칙 I)

착수 전 기준선과 마감 결과를 diff한다. webapp 기준선은 2026-10-15 실측 check-types 13건, check 105건이다.

```bash
cd server && ./bin/golangci-lint run -j 1 ./channels/... ./public/...
make migrations-extract && make store-layers && GOTOOLCHAIN=go1.26.3 make mocks && git status --porcelain
cd ../webapp && NODE_OPTIONS=--max-old-space-size=8192 npm run check-types && npm run check
cd channels && npm run i18n-check-empty
```
