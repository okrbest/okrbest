# 구현 계획: role_updated 이벤트 스코프 제한

**브랜치**: `009-scope-role-updated-ws` | **날짜**: 2026-08-12 | **명세**: [spec.md](./spec.md)

**입력**: `specs/009-scope-role-updated-ws/spec.md`의 기능 명세

## 요약

`role_updated` WebSocket 이벤트가 지금은 역할이 어떤 scheme에 속하든 상관없이 모든 접속 세션에 전역 브로드캐스트된다. upstream 커밋 [`7425c681`](https://github.com/mattermost/mattermost/commit/7425c6817bf244f976c729f8a73cecac8039a1e1)([MM-67741] Scope role_updated WS events to affected team/channel #35497)을 마이그레이션 번호 재부여만 거쳐 그대로 포팅해, team-scheme 역할은 해당 team에만, channel-scheme 역할은 해당 channel에만 이벤트를 스코프한다. `roles` 테이블에 소속 scheme을 가리키는 `schemeid` 컬럼을 추가하고 기존 데이터를 backfill한다.

## Technical Context

**Language/Version**: Go 1.24.13 (server)

**Primary Dependencies**: 기존 내부 패키지만 사용 — `server/channels/app`, `server/channels/store/sqlstore`, `server/public/model`. 신규 외부 의존성 없음.

**Storage**: PostgreSQL. `roles` 테이블에 nullable `schemeid VARCHAR(26)` 컬럼 추가(기존 morph 기반 마이그레이션 시스템, `server/channels/db/migrations/`).

**Testing**: Go `_test.go`(gotestsum, `make test-server`) — `server/channels/app`, `server/channels/store/storetest`, `server/public/model`.

**Target Platform**: 기존 Mattermost 서버(Linux), 클라이언트(webapp/모바일) 변경 없음.

**Project Type**: 기존 웹 서비스 백엔드 기능 추가(single project, server 전용).

**Performance Goals**: 없음(신규 지연시간 목표 없음) — 기존 WS 브로드캐스트 경로에 team/channel 조회 1회를 추가하되, scheme별 캐시나 페이지네이션은 upstream 그대로.

**Constraints**: FR-006/SC-005 — team/channel 각각 100,000건 상한(upstream 하드코딩 값 그대로). 마이그레이션은 무중단(nullable 컬럼 추가, `CREATE INDEX CONCURRENTLY`).

**Scale/Scope**: `roles`/`schemes` 테이블 대상(수십~수백 행 규모, posts/users급 대용량 아님). 서버 파일 10개(upstream diff 기준) + 마이그레이션 3개.

## Constitution Check

*GATE: Phase 0 리서치 전 통과 필수. Phase 1 설계 후 재확인.*

- **원칙 I (패키지별 품질 게이트)**: `server/` 변경만 발생 — `make check-style` + `make test-server`(접촉 패키지: `channels/app`, `channels/store/sqlstore`, `channels/store/storetest`, `public/model`) 적용 대상. PASS(계획 단계에서 위반 없음).
- **원칙 III (실패를 본 테스트만 인정)**: 동작 변경(이벤트 스코프 로직)이므로 TDD 적용 대상 — upstream이 이미 실패 재현 가능한 테스트(`role_test.go` scope별 케이스)를 제공하므로 그대로 포팅해 실패→통과 확인. PASS.
- **원칙 IV (라이선스·리브랜드 충실성)**: 건드리는 파일은 전부 AGPL/Apache 존(`server/channels/app`, `server/channels/store`, `server/public/model`) — copyright 헤더 유지, 리브랜드 문자열 없음(이 영역은 사용자 표시 문자열이 없음). PASS.
- **원칙 V (i18n 동기화)**: 이 커밋은 사용자 표시 문자열을 추가하지 않음(내부 이벤트 스코프 로직) — 해당 없음.
- **원칙 VI (집중 브랜치 + PR)**: `009-scope-role-updated-ws` 브랜치 1개, DB 마이그레이션 디렉터리가 CODEOWNERS 보호 경로라 PR에 code owner 리뷰 필요 — 계획 단계에서 인지, 위반 아님.
- **원칙 VII (spec 주도 워크플로)**: `/speckit-sync`에서 DB 마이그레이션 포함으로 spec 트랙 전환된 케이스 — 본 계획이 그 요건을 따름. PASS.
- **원칙 VIII (명세 문서 언어)**: 본 문서 및 하위 산출물 한국어 작성 — PASS.

위반 없음. Complexity Tracking 불필요.

## Project Structure

### Documentation (this feature)

```text
specs/009-scope-role-updated-ws/
├── plan.md              # 이 파일
├── research.md          # Phase 0 산출물
├── data-model.md         # Phase 1 산출물
├── quickstart.md         # Phase 1 산출물
├── contracts/             # 해당 없음(외부 API 계약 변경 없음 — 아래 참고)
└── tasks.md              # Phase 2 산출물 (/speckit-tasks)
```

### Source Code (repository root)

```text
server/
├── public/model/
│   └── role.go                                    # Role.SchemeId 필드 추가
├── channels/
│   ├── app/
│   │   ├── role.go                                # sendUpdatedRoleEvent 스코프 분기 재작성
│   │   └── role_test.go                           # scope별 테스트(upstream 포팅)
│   ├── store/
│   │   ├── sqlstore/
│   │   │   ├── role_store.go                      # SchemeId read/write, JOIN 조건 전환
│   │   │   └── scheme_store.go                    # createScheme에서 SchemeId 저장, Delete 조건 전환
│   │   └── storetest/
│   │       ├── role_store.go                      # SchemeId 검증(upstream 포팅)
│   │       └── scheme_store.go                    # SchemeId 검증(upstream 포팅)
│   └── db/migrations/
│       ├── migrations.list                        # 000161~163 등록
│       └── postgres/
│           ├── 000161_add_schemeid_to_roles.{up,down}.sql
│           ├── 000162_backfill_roles_schemeid.{up,down}.sql
│           └── 000163_add_roles_schemeid_index.{up,down}.sql
```

**Structure Decision**: 기존 `server/` 단일 프로젝트 구조 그대로 사용. webapp 변경 없음(upstream 커밋도 서버 전용이며, `Role.SchemeId`는 API 응답에 부가 필드로만 노출돼 기존 클라이언트에 영향 없음). `contracts/` 디렉터리는 생략 — 기존 역할 API(`GET /api/v4/roles/*`)의 요청/응답 스키마가 바뀌지 않고(응답 JSON에 필드 하나가 늘 뿐, 계약 위반 아님) 신규 엔드포인트도 없어 별도 계약 문서화 대상이 없다.
