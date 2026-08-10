# Research: 공개 채널 멤버십 없는 검색 허용

**Feature**: [spec.md](./spec.md) | **Date**: 2026-08-10

이 기능은 upstream 참조 구현(`2ada8d76`, `7e0af2de`)이 이미 코드·테스트·i18n 문자열로 완결돼 있고, `/speckit-clarify` 세션에서 "upstream에서 벗어나지 않게" 방향으로 3개 핵심 결정(적용 범위·백필 처리율·UI 표시)을 확정했다. 따라서 Phase 0 연구는 새로운 기술 선택을 탐색하는 것이 아니라, **okrbest 현재 코드베이스에서 참조 구현의 각 결정이 어디에 어떻게 대응되는지 확인**하는 데 집중한다.

## 결정 1: 검색 접근 필터를 어디서 적용할 것인가

- **Decision**: `server/enterprise/elasticsearch/elasticsearch/elasticsearch.go`의 `SearchPosts`(현재 353번째 줄)와 `server/enterprise/elasticsearch/opensearch/opensearch.go`의 동명 함수(369번째 줄) 양쪽에 동일한 채널 접근 필터 분기를 추가한다. 새 설정이 켜져 있고 컴플라이언스 모드가 꺼져 있을 때만 "멤버 채널 OR (공개 채널 AND 같은 팀)" 필터로 전환한다.
- **Rationale**: okrbest의 현재 `SearchPosts` 시그니처와 필터 빌드 구조가 upstream 참조 구현의 수정 이전 상태와 동일함을 확인했다(직접 diff 대조). 두 백엔드(ES/OS)가 별도 구현체를 가지므로 동일 로직을 양쪽에 적용해야 사용자 경험이 일관된다(spec Assumptions 참고).
- **Alternatives considered**: 검색 스토어 레이어(`server/channels/store/searchlayer`)에서 결과를 사후 필터링하는 방식은 이미 색인에서 걸러진 데이터를 다시 넓힐 수 없어 기각. 애플리케이션 레이어(App 함수)에서 후처리하는 방식은 대량 결과 페이지네이션과 상호작용이 복잡해져 참조 구현과 다른 성능 특성을 가지므로 기각.

## 결정 2: 게시물 색인에 채널 유형을 어떻게 반영할 것인가

- **Decision**: `IndexPost` 시그니처에 `channelType string` 인자를 추가하고, 색인 스키마(`server/enterprise/elasticsearch/common/templates.go`)에 `channel_type` 필드를 추가한다. 신규 게시물은 색인 시점에 값이 채워지고, 기존 게시물은 별도 백필 작업으로 채운다.
- **Rationale**: 검색 필터가 `channel_type`으로 공개/비공개를 판별하려면 색인에 그 값이 있어야 한다. 참조 구현이 이 방식을 사용했고, okrbest 현재 색인 스키마에는 해당 필드가 없음을 확인했다.
- **Alternatives considered**: 검색 시점에 매번 채널 스토어를 조회해 유형을 판별하는 방식은 검색 요청마다 N+1 조회가 발생해 성능 저하가 크므로 기각.

## 결정 3: 백필을 언제, 얼마나 빠르게 실행할 것인가

- **Decision**: `server/channels/app/platform/searchengine.go`의 `StartSearchEngine`(검색 엔진 기동/설정 변경 리스너)에 새 오케스트레이션 함수 `backfillPostsChannelType`을 추가한다. 트리거는 ① 설정이 켜진 채로 검색 엔진이 새로 기동될 때, ② 검색 엔진이 이미 가동 중인 상태에서 설정이 꺼짐→켜짐으로 바뀔 때 두 경우다. 처리율은 Elasticsearch·OpenSearch 공통 초당 10,000요청으로 고정한다(clarify Q2).
- **Rationale**: 참조 구현과 그 후속 튜닝(`7e0af2de`)이 이미 두 백엔드의 처리율 불일치를 해소해뒀다. okrbest가 별도 값을 선택할 이유가 없다(spec Q2 확정 사항).
- **Alternatives considered**: 관리자가 처리율을 직접 설정하게 하는 방안은 clarify에서 명시적으로 기각(Q2 Option B). 백필을 동기적으로 즉시 완료시키는 방안은 대량 데이터 환경에서 검색 엔진에 순간 부하를 줄 수 있어 기각.

## 결정 4: 컴플라이언스 모드와의 상호작용

- **Decision**: `SearchPosts` 진입 시 `cfg.ComplianceSettings.Enable`이 참이면 새 설정 값과 무관하게 기존 멤버십 기반 필터를 사용한다(`includePublicChannels := EnableSearchPublicChannelsWithoutMembership && !ComplianceSettings.Enable`).
- **Rationale**: 컴플라이언스 모드는 감사·법적 보존 목적의 엄격한 접근 통제를 전제하므로, 검색 확장 기능이 이를 우회하지 않도록 안전장치를 코드 레벨에서 강제한다. okrbest `server/public/model/config.go`에 `ComplianceSettings.Enable` 필드가 이미 존재함을 확인했다(2721번째 줄).
- **Alternatives considered**: 관리자 UI에서 두 설정이 동시에 켜지지 않도록 막는 방식은 설정 변경 순서에 따라 우회 가능한 허점이 남아 기각 — 코드 레벨 강제가 더 안전하다.

## 결정 5: 채널 유형 변경 시 재색인

- **Decision**: `server/channels/store/searchlayer/channel_layer.go`의 `Update` 함수에서 채널 유형 변경을 감지해(변경 전후 조회) `reindexChannelPosts`를 호출, 해당 채널의 색인된 게시물 `channel_type`을 일괄 갱신한다.
- **Rationale**: 채널이 공개→비공개로 전환됐는데 색인이 갱신되지 않으면 FR-003(비공개 채널 노출 금지)이 깨질 수 있다. 참조 구현이 정확히 이 경로에서 처리했다.
- **Alternatives considered**: 별도 백그라운드 잡으로 주기적 재검사하는 방식은 전환 직후 짧은 시간 동안 노출 위험 창이 생겨 기각 — 채널 업데이트 트랜잭션과 같은 흐름에서 즉시 처리하는 편이 안전하다.

## 결정 6: 관리자 콘솔 UI

- **Decision**: `webapp/channels/src/components/admin_console/elasticsearch_settings.tsx`에 새 토글 하나를 추가한다(제목/설명 문자열은 en.json/ko.json 동시 추가, 별도 배지 없음 — clarify Q3).
- **Rationale**: 기존 Elasticsearch 설정 화면의 다른 토글들과 동일한 패턴을 재사용하면 별도 컴포넌트 설계가 필요 없다.
- **Alternatives considered**: 새 설정 전용 별도 섹션/모달을 만드는 방안은 참조 구현에도 없고 UI 일관성만 해치므로 기각.

## 미해결 NEEDS CLARIFICATION

없음 — Technical Context의 모든 항목이 spec.md(clarify 확정 포함)와 okrbest 현재 코드베이스 확인으로 해소됨.
