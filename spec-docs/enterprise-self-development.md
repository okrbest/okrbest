# OKR Best Enterprise 기능 자체 개발 계획

## 목적

Mattermost Enterprise 라이센스 의존성 없이 고급 기능을 자체 구현하여:
1. 법적 분쟁 위험 제거
2. 라이센스 비용 절감
3. 기능 커스터마이징 자유도 확보

---

## 법적 안전 가이드라인

### ⛔ 절대 금지 사항

| 금지 행위 | 이유 | 위반 시 위험 |
|---------|------|------------|
| `server/enterprise/` 코드 복사 | Source Available License 위반 | 저작권 침해 소송 |
| `server/enterprise/` 코드 직접 참조하여 구현 | 파생 저작물 간주 가능 | 라이센스 위반 |
| "Mattermost Enterprise" 명칭 사용 | 상표권 침해 | 상표 침해 소송 |
| Enterprise 라이센스 위조/우회 배포 | 계약 위반 | 형사 처벌 가능 |

### ✅ 허용 범위

| 허용 행위 | 근거 |
|---------|------|
| AGPL 코드 (`server/channels/` 등) 수정 | AGPL v3.0 허용 (소스 공개 의무) |
| Apache 2.0 코드 (`webapp/`, `server/public/`) 수정 | Apache 2.0 허용 |
| 기능 인터페이스 참조 후 독자적 구현 | Clean Room 설계 원칙 |
| 오픈소스 라이브러리 활용 신규 구현 | 각 라이브러리 라이센스 준수 시 |
| 라이센스 체크 로직 수정 | AGPL/Apache 영역에 해당 |

### 🔷 Clean Room 설계 원칙

**Enterprise 코드를 보지 않고 구현하는 방법:**

1. **기능 명세만 확인**: 공개 문서, API 스펙만 참조
2. **인터페이스만 참조**: `server/public/` 내 인터페이스 정의
3. **독립 구현**: 오픈소스 라이브러리 기반 신규 작성
4. **코드 리뷰**: Enterprise 코드 본 적 없는 개발자가 검토

---

## 기능별 자체 개발 계획

### Phase 1: 인증/SSO (우선순위 높음)

#### 1.1 LDAP/Active Directory 인증

| 항목 | 내용 |
|-----|------|
| **현황** | `Features.LDAP` 라이센스 필요 |
| **자체 구현** | `go-ldap/ldap` 라이브러리 활용 |
| **난이도** | ⭐⭐⭐ (중) |

**오픈소스 라이브러리:**
- `github.com/go-ldap/ldap/v3` (MIT License)

**구현 범위:**

| 작업 | 파일 | 함수/컴포넌트 | 상태 |
|-----|------|-------------|------|
| LDAP 클라이언트 래퍼 | `server/channels/app/ldap_custom.go` (신규) | `LDAPClient` | ⬜ |
| 인증 플로우 통합 | `server/channels/app/authentication.go` | `authenticateUser()` | ⬜ |
| 사용자 동기화 | `server/channels/app/ldap_sync.go` (신규) | `SyncLDAPUsers()` | ⬜ |
| 관리자 설정 UI | `webapp/.../admin_console/` | LDAP 설정 패널 | ⬜ |
| 라이센스 체크 제거 | `server/channels/api4/ldap.go` | API 핸들러 | ⬜ |

**예상 구현 코드 구조:**
```go
// server/channels/app/ldap_custom.go
package app

import (
    "github.com/go-ldap/ldap/v3"
)

type LDAPClient struct {
    conn   *ldap.Conn
    config *model.LdapSettings
}

func (c *LDAPClient) Authenticate(username, password string) (*model.User, error) {
    // 독자적 구현
}

func (c *LDAPClient) SearchUsers(filter string) ([]*model.User, error) {
    // 독자적 구현
}
```

#### 1.2 SAML 2.0 SSO

| 항목 | 내용 |
|-----|------|
| **현황** | `Features.SAML` 라이센스 필요 |
| **자체 구현** | `crewjam/saml` 라이브러리 활용 |
| **난이도** | ⭐⭐⭐⭐ (상) |

**오픈소스 라이브러리:**
- `github.com/crewjam/saml` (BSD License)

**구현 범위:**

| 작업 | 파일 | 함수/컴포넌트 | 상태 |
|-----|------|-------------|------|
| SAML SP 구현 | `server/channels/app/saml_custom.go` (신규) | `SAMLProvider` | ⬜ |
| 메타데이터 엔드포인트 | `server/channels/api4/saml_custom.go` (신규) | API 핸들러 | ⬜ |
| ACS(Assertion Consumer) | 위 파일 | `HandleACS()` | ⬜ |
| 로그인 플로우 통합 | `server/channels/app/login.go` | `DoLogin()` | ⬜ |
| 관리자 설정 UI | `webapp/.../admin_console/` | SAML 설정 패널 | ⬜ |

#### 1.3 OpenID Connect

| 항목 | 내용 |
|-----|------|
| **현황** | `Features.OpenId` 라이센스 필요 |
| **자체 구현** | `coreos/go-oidc` 라이브러리 활용 |
| **난이도** | ⭐⭐⭐ (중) |

**오픈소스 라이브러리:**
- `github.com/coreos/go-oidc/v3` (Apache 2.0)

**구현 범위:**

| 작업 | 파일 | 함수/컴포넌트 | 상태 |
|-----|------|-------------|------|
| OIDC Provider | `server/channels/app/oidc_custom.go` (신규) | `OIDCProvider` | ⬜ |
| 콜백 핸들러 | `server/channels/api4/oauth_custom.go` (신규) | `HandleOIDCCallback()` | ⬜ |
| 토큰 검증 | 위 파일 | `ValidateIDToken()` | ⬜ |

---

### Phase 2: 검색/인덱싱

#### 2.1 Elasticsearch/OpenSearch 통합

| 항목 | 내용 |
|-----|------|
| **현황** | `Features.Elasticsearch` 라이센스 필요, `server/enterprise/elasticsearch/` 사용 불가 |
| **자체 구현** | OpenSearch 공식 Go 클라이언트 활용 |
| **난이도** | ⭐⭐⭐⭐ (상) |

**오픈소스 라이브러리:**
- `github.com/opensearch-project/opensearch-go` (Apache 2.0)

**구현 범위:**

| 작업 | 파일 | 함수/컴포넌트 | 상태 |
|-----|------|-------------|------|
| 검색 엔진 인터페이스 정의 | `server/channels/app/search_engine.go` (신규) | `SearchEngine` interface | ⬜ |
| OpenSearch 어댑터 | `server/channels/app/opensearch/client.go` (신규) | `OpenSearchClient` | ⬜ |
| 인덱싱 Job | `server/channels/jobs/opensearch/indexer.go` (신규) | `IndexerWorker` | ⬜ |
| 검색 API 통합 | `server/channels/api4/post.go` | `searchPosts()` | ⬜ |
| 인덱스 매핑 정의 | `server/channels/app/opensearch/mappings.go` (신규) | 매핑 JSON | ⬜ |

**인덱스 매핑 (참고용, 독자 설계):**
```json
{
  "mappings": {
    "properties": {
      "id": { "type": "keyword" },
      "channel_id": { "type": "keyword" },
      "user_id": { "type": "keyword" },
      "message": { 
        "type": "text",
        "analyzer": "korean"
      },
      "create_at": { "type": "date" }
    }
  }
}
```

---

### Phase 3: 데이터 관리

#### 3.1 Data Retention (데이터 보관 정책)

| 항목 | 내용 |
|-----|------|
| **현황** | `Features.DataRetention` 라이센스 필요 |
| **자체 구현** | 기존 Job 프레임워크 활용, 정책 로직 신규 작성 |
| **난이도** | ⭐⭐⭐ (중) |

**구현 범위:**

| 작업 | 파일 | 함수/컴포넌트 | 상태 |
|-----|------|-------------|------|
| 정책 모델 정의 | `server/public/model/retention_policy.go` (신규) | `RetentionPolicy` | ⬜ |
| 삭제 Job | `server/channels/jobs/retention/worker.go` (신규) | `RetentionWorker` | ⬜ |
| 스케줄러 | `server/channels/jobs/retention/scheduler.go` (신규) | `RetentionScheduler` | ⬜ |
| 관리자 API | `server/channels/api4/retention.go` (신규) | CRUD API | ⬜ |
| 관리자 UI | `webapp/.../admin_console/` | Retention 설정 | ⬜ |

#### 3.2 Message Export (메시지 내보내기)

| 항목 | 내용 |
|-----|------|
| **현황** | `Features.MessageExport` 라이센스 필요, `server/enterprise/message_export/` 사용 불가 |
| **자체 구현** | CSV/JSON 내보내기 독자 구현 |
| **난이도** | ⭐⭐⭐ (중) |

**구현 범위:**

| 작업 | 파일 | 함수/컴포넌트 | 상태 |
|-----|------|-------------|------|
| Export Job | `server/channels/jobs/export/worker.go` (신규) | `ExportWorker` | ⬜ |
| CSV 포매터 | `server/channels/jobs/export/csv.go` (신규) | `CSVExporter` | ⬜ |
| JSON 포매터 | `server/channels/jobs/export/json.go` (신규) | `JSONExporter` | ⬜ |
| API 엔드포인트 | `server/channels/api4/export.go` (신규) | 내보내기 API | ⬜ |

---

### Phase 4: 운영/모니터링

#### 4.1 High Availability (클러스터링)

| 항목 | 내용 |
|-----|------|
| **현황** | `Features.Cluster` 라이센스 필요 |
| **자체 구현** | Redis Pub/Sub 기반 클러스터 통신 |
| **난이도** | ⭐⭐⭐⭐⭐ (최상) |

**오픈소스 라이브러리:**
- `github.com/redis/go-redis/v9` (BSD License)
- `github.com/hashicorp/memberlist` (MPL 2.0) - 노드 디스커버리

**구현 범위:**

| 작업 | 파일 | 함수/컴포넌트 | 상태 |
|-----|------|-------------|------|
| 클러스터 인터페이스 | `server/platform/services/cluster_custom/interface.go` (신규) | `ClusterInterface` | ⬜ |
| Redis 메시지 브로커 | `server/platform/services/cluster_custom/redis.go` (신규) | `RedisCluster` | ⬜ |
| 노드 디스커버리 | `server/platform/services/cluster_custom/discovery.go` (신규) | `NodeDiscovery` | ⬜ |
| 세션 동기화 | 위 파일들 | Session sync | ⬜ |

#### 4.2 Metrics (Prometheus 메트릭)

| 항목 | 내용 |
|-----|------|
| **현황** | `Features.Metrics` 라이센스 필요 |
| **자체 구현** | Prometheus 공식 Go 클라이언트 (이미 AGPL 영역에 일부 존재) |
| **난이도** | ⭐⭐ (하) |

**오픈소스 라이브러리:**
- `github.com/prometheus/client_golang` (Apache 2.0)

**구현 범위:**

| 작업 | 파일 | 함수/컴포넌트 | 상태 |
|-----|------|-------------|------|
| 메트릭 레지스트리 | `server/platform/services/telemetry/metrics.go` | 기존 확장 | ⬜ |
| 커스텀 메트릭 추가 | 위 파일 | 비즈니스 메트릭 | ⬜ |
| Grafana 대시보드 | `docs/grafana/` (신규) | JSON 대시보드 | ⬜ |

---

### Phase 5: 규정 준수

#### 5.1 Compliance (감사 로깅)

| 항목 | 내용 |
|-----|------|
| **현황** | `Features.Compliance` 라이센스 필요 |
| **자체 구현** | 감사 이벤트 로깅 시스템 독자 구현 |
| **난이도** | ⭐⭐⭐ (중) |

**구현 범위:**

| 작업 | 파일 | 함수/컴포넌트 | 상태 |
|-----|------|-------------|------|
| 감사 이벤트 모델 | `server/public/model/audit_event.go` (신규) | `AuditEvent` | ⬜ |
| 감사 로거 | `server/channels/app/audit_logger.go` (신규) | `AuditLogger` | ⬜ |
| 이벤트 훅 삽입 | `server/channels/app/*.go` | 주요 동작에 훅 | ⬜ |
| 감사 리포트 API | `server/channels/api4/audit.go` (신규) | 리포트 API | ⬜ |

#### 5.2 Custom Permissions (커스텀 권한)

| 항목 | 내용 |
|-----|------|
| **현황** | `Features.CustomPermissionsSchemes` 라이센스 필요 |
| **자체 구현** | 기존 권한 시스템 확장 |
| **난이도** | ⭐⭐⭐⭐ (상) |

**구현 범위:**

| 작업 | 파일 | 함수/컴포넌트 | 상태 |
|-----|------|-------------|------|
| 스킴 모델 확장 | `server/public/model/scheme.go` | 기존 확장 | ⬜ |
| 커스텀 역할 API | `server/channels/api4/role.go` | 기존 확장 | ⬜ |
| 권한 체크 로직 | `server/channels/app/authorization.go` | `HasPermissionTo()` | ⬜ |
| 관리자 UI | `webapp/.../admin_console/` | 권한 설정 패널 | ⬜ |

---

## 라이센스 체크 수정 계획

### 수정 대상 파일

| 파일 | 수정 내용 | 우선순위 |
|-----|---------|---------|
| `server/public/model/license.go` | `SetDefaults()`에서 모든 Feature true | 🔴 높음 |
| `server/public/pluginapi/license.go` | 체크 함수 항상 true 반환 | 🔴 높음 |
| `server/channels/app/license.go` | 라이센스 nil 체크 우회 | 🟡 중간 |
| `server/config/client.go` | 클라이언트 설정 노출 | 🟡 중간 |
| `webapp/.../selectors/plugins.ts` | 프론트엔드 체크 제거 | 🟢 낮음 |

### 권장 수정 방법

**`server/public/model/license.go`:**
```go
func (f *Features) SetDefaults() {
    // 모든 기능 활성화
    f.FutureFeatures = NewPointer(true)
    f.LDAP = NewPointer(true)
    f.LDAPGroups = NewPointer(true)
    f.MFA = NewPointer(true)
    f.GoogleOAuth = NewPointer(true)
    f.Office365OAuth = NewPointer(true)
    f.OpenId = NewPointer(true)
    f.Compliance = NewPointer(true)
    f.Cluster = NewPointer(true)
    f.Metrics = NewPointer(true)
    f.MHPNS = NewPointer(true)
    f.SAML = NewPointer(true)
    f.Elasticsearch = NewPointer(true)
    f.DataRetention = NewPointer(true)
    f.MessageExport = NewPointer(true)
    f.CustomPermissionsSchemes = NewPointer(true)
    f.GuestAccounts = NewPointer(true)
    f.GuestAccountsPermissions = NewPointer(true)
    f.CustomTermsOfService = NewPointer(true)
    f.IDLoadedPushNotifications = NewPointer(true)
    f.LockTeammateNameDisplay = NewPointer(true)
    f.EnterprisePlugins = NewPointer(true)
    f.AdvancedLogging = NewPointer(true)
    f.SharedChannels = NewPointer(true)
    f.RemoteClusterService = NewPointer(true)
    f.OutgoingOAuthConnections = NewPointer(true)
    f.Cloud = NewPointer(false) // Cloud는 비활성화
    
    // Users 제한 해제
    f.Users = NewPointer(0) // 0 = 무제한
}
```

---

## 개발 일정 (예상)

### 전체 타임라인

| Phase | 기간 | 주요 작업 |
|-------|-----|---------|
| **Phase 0** | 1주 | 라이센스 체크 수정, 개발 환경 구성 |
| **Phase 1** | 4주 | 인증/SSO (LDAP, SAML, OIDC) |
| **Phase 2** | 3주 | 검색 (OpenSearch 통합) |
| **Phase 3** | 2주 | 데이터 관리 (Retention, Export) |
| **Phase 4** | 4주 | 운영 (클러스터링, 메트릭) |
| **Phase 5** | 2주 | 규정 준수 (감사, 권한) |
| **Buffer** | 2주 | 테스트, 버그 수정 |
| **총계** | 약 18주 | - |

### 우선순위 기준

1. **필수 기능**: 라이센스 체크 우회, 기본 인증
2. **핵심 비즈니스**: LDAP, 검색, 권한
3. **운영 안정성**: 클러스터링, 메트릭
4. **부가 기능**: 내보내기, 감사

---

## 리스크 관리

### 법적 리스크

| 리스크 | 완화 방법 |
|-------|---------|
| 저작권 침해 주장 | Clean Room 설계, 구현 문서화 |
| 특허 침해 | 기능별 특허 검색, 대안 설계 |
| 상표권 침해 | "Enterprise" 명칭 미사용 |

### 기술 리스크

| 리스크 | 완화 방법 |
|-------|---------|
| 기존 코드 호환성 | 인터페이스 동일하게 유지 |
| 성능 저하 | 벤치마크 테스트 필수 |
| 보안 취약점 | 보안 감사, 오픈소스 라이브러리 검증 |

---

## 필수 문서화

각 기능 구현 시 다음 문서 작성 필수:

1. **설계 문서**: 아키텍처, 인터페이스 정의
2. **구현 근거**: 참조한 공개 명세 목록 (Enterprise 코드 아님 증명)
3. **테스트 케이스**: 기능 검증 테스트
4. **라이센스 목록**: 사용한 오픈소스 라이브러리와 라이센스

---

## 참고 자료

### 오픈소스 라이브러리

| 기능 | 라이브러리 | 라이센스 | URL |
|-----|----------|---------|-----|
| LDAP | go-ldap/ldap | MIT | github.com/go-ldap/ldap |
| SAML | crewjam/saml | BSD | github.com/crewjam/saml |
| OIDC | coreos/go-oidc | Apache 2.0 | github.com/coreos/go-oidc |
| OpenSearch | opensearch-go | Apache 2.0 | github.com/opensearch-project/opensearch-go |
| Redis | go-redis | BSD | github.com/redis/go-redis |
| Prometheus | client_golang | Apache 2.0 | github.com/prometheus/client_golang |

### 공식 문서

- [Mattermost API Reference](https://api.mattermost.com/)
- [Mattermost Developer Documentation](https://developers.mattermost.com/)
- [AGPL v3.0 Full Text](https://www.gnu.org/licenses/agpl-3.0.html)
