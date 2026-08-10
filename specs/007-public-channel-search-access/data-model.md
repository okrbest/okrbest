# Data Model: 공개 채널 멤버십 없는 검색 허용

**Feature**: [spec.md](./spec.md) | **Research**: [research.md](./research.md)

새 DB 스키마·마이그레이션은 없다. 기존 엔티티에 필드를 추가하거나(설정), 검색 색인 문서에 필드를 추가하는(게시물 색인) 변경뿐이다.

## EnableSearchPublicChannelsWithoutMembership (설정 필드)

`server/public/model/config.go`의 `ElasticsearchSettings` 구조체에 추가되는 불리언 필드.

| 필드 | 타입 | 기본값 | 설명 |
|---|---|---|---|
| `EnableSearchPublicChannelsWithoutMembership` | `*bool` | `false` | 켜지면 검색 시 팀 내 공개 채널을 멤버십 무관하게 포함. 컴플라이언스 모드가 켜져 있으면 이 값과 무관하게 무시됨(spec FR-005). |

**검증 규칙**: 없음(단순 불리언, `SetDefaults()`에서 nil이면 `false`로 채움 — 기존 다른 Elasticsearch 설정 필드와 동일 패턴).

**관계**: `ComplianceSettings.Enable`(기존 필드, `server/public/model/config.go` 2721번째 줄)과 상호작용 — 검색 필터 계산 시점에 두 값을 함께 읽어 실제 적용 여부(`includePublicChannels`)를 판단한다. 이 판단 로직 자체는 저장되는 데이터가 아니라 런타임 계산값이다.

## 게시물 색인 문서 (Elasticsearch/OpenSearch)

기존 게시물 색인 문서(`server/enterprise/elasticsearch/common/templates.go`의 매핑)에 필드 1개 추가.

| 필드 | 타입 | 설명 |
|---|---|---|
| `channel_type` | keyword (문자열, "O"=공개/"P"=비공개) | 게시물이 속한 채널의 유형. 검색 필터가 이 값으로 공개 채널 여부를 판별한다. |

**생명주기**:
- **생성**: 게시물 색인 시(`IndexPost`) 해당 채널 조회 결과에서 유형을 함께 기록.
- **갱신 — 백필**: 설정을 처음 켰을 때, 기존에 색인된(값이 없는) 게시물 문서에 대해 `channel_id` 기준으로 일괄 `UpdateByQuery`를 실행해 채워 넣는다. 처리율 초당 10,000요청 고정(clarify Q2).
- **갱신 — 채널 유형 변경**: 채널의 공개/비공개 유형이 바뀌면(`SearchChannelStore.Update`에서 감지), 그 채널에 속한 모든 게시물 문서의 `channel_type`을 새 값으로 일괄 갱신(`reindexChannelPosts`).
- **삭제**: 게시물/채널 삭제 시 기존 색인 삭제 흐름을 그대로 따름(변경 없음).

**정합성 창(window)**: 백필이 완료되기 전까지 오래된 게시물 일부는 새 검색 범위 판단에서 값이 비어 있을 수 있다(Edge Cases 참고) — 이 경우 해당 게시물은 새 검색 범위(비멤버 공개 채널)에서 누락될 뿐, 잘못 노출되는 방향의 오류는 아니다(안전한 실패 방향).

## 검색 필터 계산 (런타임, 비영속)

검색 요청 시점에 다음을 계산해 Elasticsearch/OpenSearch 쿼리의 채널 접근 필터를 결정한다. 저장되는 엔티티가 아니라 각 검색 요청마다 재계산되는 값이다.

```
includePublicChannels = EnableSearchPublicChannelsWithoutMembership AND NOT ComplianceSettings.Enable

if includePublicChannels:
    채널 필터 = (channel_id IN 사용자의 멤버 채널) OR (channel_type == "O" AND team_id IN 사용자의 소속 팀)
else:
    채널 필터 = channel_id IN 사용자의 멤버 채널   # 기존 동작과 동일
```

## Key Entities (spec.md 대응)

| spec.md의 Key Entity | 이 문서의 대응 |
|---|---|
| 검색 설정(Search Configuration) | `EnableSearchPublicChannelsWithoutMembership` 필드 |
| 채널(Channel) | 기존 `Channel` 모델(변경 없음) — `Type`, `TeamId`가 필터 판단에 사용됨 |
| 게시물 색인(Post Index) | 게시물 색인 문서의 `channel_type` 필드 |
