# Implementation Plan: 채널 비멤버 컨텐츠 접근 감사 로깅

**Branch**: `005-post-access-audit-logging` | **Date**: 2026-07-31 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/005-post-access-audit-logging/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

사용자가 자신이 멤버가 아닌 채널의 게시물·파일·채널 북마크에 접근했을 때 이를 감사 로그에
`non_channel_member_access`(및 미리보기 전용 `non_channel_member_access_on_previews`) 파라미터로
기록한다. upstream 커밋 `b5a816a`(mattermost/mattermost #31266)를 근거로 삼아, 권한 판정 함수의
반환값에 "채널 멤버십 여부"를 추가로 실어 나르고, 이를 게시물/파일/북마크 관련 API 및 웹소켓
퍼머링크 훅에서 감사 레코드에 반영한다. 기존 감사 로그 인프라(`model.AuditRecord`, 감사 이벤트
상수 체계)를 그대로 재사용하며, 신규 저장소·API 응답 스키마 변경은 없다.

## Technical Context

**Language/Version**: Go 1.24.6 (server, go workspaces)

**Primary Dependencies**: 기존 Mattermost/okrbest 감사 로깅 프레임워크(`server/public/model/audit_events.go`,
`model.AuditRecord`, `mlog`) — 신규 외부 의존성 없음

**Storage**: N/A — 기존 감사 로그 싱크(설정된 audit 파일/시스로그)를 그대로 사용, 신규 스토리지·마이그레이션 없음

**Testing**: Go test, 패키지 옆 colocated `_test.go`(gotestsum 실행) — 원칙 III

**Target Platform**: 기존 okrbest 서버(Linux 자체 호스팅), 변경 없음

**Project Type**: 기존 모노레포의 `server/` 백엔드 단일 프로젝트 — webapp 변경 없음

**Performance Goals**: 기존 읽기 경로에 감사 레코드 부착만 추가 — 응답 지연에 유의미한 영향이 없어야 함(정성적 목표, 별도 벤치마크 불필요; 기존 감사 기록 부착 비용과 동일한 오더)

**Constraints**: API 응답 스키마·동작 불변(spec SC-004); 시그니처 변경은 `server/channels/app`,
`server/channels/api4` 내부 호출부에 한정하고 `PluginAPI`(`server/channels/app/plugin_api.go`) 등
외부 노출 인터페이스는 그대로 유지

**Scale/Scope**: upstream 커밋 기준 89개 파일, 게시물(FR-001·002)·파일(FR-003)·채널 북마크(FR-004)·
미리보기/웹소켓(FR-005·006) 관련 API 전 구간

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| 원칙 | 평가 | 근거 |
|---|---|---|
| I. 패키지별 품질 게이트 | PASS | `server/` 변경 → `cd server && make check-style` + 영향 패키지(`api4`, `app`, `public/model`, `wsapi`, `platform/services/sharedchannel`) `go test` 필요. tasks.md에 게이트 태스크로 반영. |
| II. webapp npm workspaces 전용 | N/A / PASS | 이 기능은 `webapp/` 변경이 없음(서버 전용 감사 로깅). |
| III. 동작 변경 시 테스트 동반 | PASS(조건부) | spec 파이프라인 경로(순수 cherry-pick 예외 미적용)이므로 테스트 동반이 원칙. upstream 커밋이 이미 대규모 테스트(`authorization_test.go` +271줄, `post_test.go` +463줄 등)를 포함 — 이를 adapt하여 재사용하고, okrbest 충돌 지점(아래 연구 결과 참고)은 추가 검증한다. |
| IV. 라이선스·리브랜드 충실성 | PASS | 파일 헤더·NOTICE 변경 없음, 사용자 노출 문자열(리브랜드 대상) 없음. |
| V. i18n 동기화 | N/A / PASS | 감사 로그 파라미터는 관리자 전용 서버 내부 로그이며 `en.json`/`ko.json` 번역 대상 문자열을 추가하지 않음. |
| VI. 집중 브랜치 + Conventional Commits + PR | PASS | 전용 feature 브랜치에서 진행, PR 경유 머지. 구현 완료 커밋 본문에 `Upstream: https://github.com/mattermost/mattermost/commit/b5a816a657d6f33a96d374b04212685e2b0df77d` 포함 → ledger 자동 차감. |
| VII. Spec 주도 개발 워크플로 | PASS | constitution → specify → clarify → **plan**(현재) → tasks → implement 순서를 따름. |

위반 사항 없음 — Complexity Tracking 불필요.

**Phase 1 설계 후 재확인**: `data-model.md`(신규 저장소·스키마 없음)와 `quickstart.md`(신규
외부 계약 없음)를 반영해도 위 평가는 변하지 않는다 — 전 항목 PASS 유지.

## Project Structure

### Documentation (this feature)

```text
specs/005-post-access-audit-logging/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md         # Phase 1 output (/speckit-plan command)
├── quickstart.md         # Phase 1 output (/speckit-plan command)
└── tasks.md              # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

`contracts/`는 생성하지 않는다 — 이 기능은 신규 외부 인터페이스를 노출하지 않는다(API 응답
스키마 불변, `PluginAPI` 외부 시그니처 불변, 감사 로그는 내부 로깅 파라미터 확장에 그침).
자세한 근거는 [research.md](research.md)의 "PluginAPI 외부 호환성" 항목 참고.

### Source Code (repository root)

기존 okrbest 모노레포 구조를 그대로 사용한다(신규 디렉터리 없음). 이번 기능이 실제로 건드리는
영역:

```text
server/
├── public/model/
│   └── audit_events.go                 # 감사 이벤트 상수 추가 (게시물/파일/북마크)
├── channels/
│   ├── app/
│   │   ├── authorization.go            # SessionHasPermissionToChannel 등 (bool)→(bool,bool)
│   │   ├── post.go                     # CreatePost/CreatePostAsUser/GetPostIfAuthorized 등
│   │   ├── post_metadata.go            # SanitizePostMetadataForUser/SanitizePostListMetadataForUser
│   │   ├── file.go                     # 파일 조회 권한 판정
│   │   ├── notification.go             # SendNotifications/RemoveNotifications
│   │   ├── user.go, channel.go, web_broadcast_hooks.go 등 호출부 조정
│   │   └── plugin_api.go               # 내부 호출부만 조정, 외부 시그니처 불변
│   ├── api4/
│   │   ├── post.go                     # getPost/getPostsForChannel/getPostThread/searchPosts 등
│   │   ├── file.go                     # getFile/getFileThumbnail/getFilePreview/searchFiles 등
│   │   ├── channel.go                  # getPinnedPosts
│   │   ├── channel_bookmark.go         # 북마크 CRUD + 목록 조회
│   │   ├── content_flagging.go, system.go, user.go 등 호출부 조정
│   └── wsapi/, platform/services/sharedchannel/  # 호출부 조정
```

**Structure Decision**: 신규 프로젝트/디렉터리를 만들지 않고 기존 `server/` 백엔드 구조를
그대로 확장한다. `webapp/`는 이번 기능과 무관하므로 변경하지 않는다.

## Complexity Tracking

> Constitution Check 위반 없음 — 이 섹션은 해당 사항 없음.
