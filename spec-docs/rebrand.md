# OKR Best 리브랜딩 가이드

## 라이센스 정책 요약

### 적용 라이센스별 영역

| 라이센스 | 적용 영역 | 리브랜딩 가능 여부 |
|---------|---------|------------------|
| **Apache 2.0** | `server/templates/`, `server/i18n/`, `server/public/`, `webapp/` | ✅ 가능 (저작권 유지 필수) |
| **AGPL v3.0** | 그 외 서버 코드 | ✅ 가능 (소스 공개 의무) |
| **Enterprise License** | `server/enterprise/` | ⚠️ 사용 제한 (유료 라이센스 필요) |

### 필수 준수 사항

1. **저작권 표시 유지**: 모든 파일의 `Copyright (c) 2015-present Mattermost, Inc.` 헤더 유지
2. **NOTICE 파일 유지**: `NOTICE.txt` 파일 배포 시 포함 필수
3. **소스 코드 공개**: AGPL v3.0에 따라 수정된 소스 공개 의무
4. **트레이드마크**: "Mattermost" 상표 사용 시 별도 승인 필요

---

## 리브랜딩 작업 범위

### 1. 시각적 요소 (로고/이미지)

| 파일 | 설명 |
|-----|------|
| `webapp/channels/src/images/logo.svg` | 메인 로고 |
| `webapp/channels/src/images/logo.png` | 메인 로고 PNG |
| `webapp/channels/src/images/logoWhite.png` | 흰색 로고 |
| `webapp/channels/src/images/logo_email_*.png` | 이메일 템플릿용 로고 |
| `webapp/channels/src/components/common/svg_images_components/logo_dark_blue_svg.tsx` | SVG 로고 컴포넌트 |
| `webapp/channels/src/components/widgets/icons/mattermost_logo.tsx` | 로고 아이콘 컴포넌트 |
| `server/templates/partials/logo.mjml` | 이메일 템플릿 로고 |
| `e2e-tests/cypress/tests/fixtures/MM-logo-horizontal.png` | 테스트용 로고 |

### 2. 텍스트/UI (다국어)

| 파일 | "Mattermost" 문자열 수 |
|-----|---------------------|
| `webapp/channels/src/i18n/en.json` | ~300개 |
| `webapp/channels/src/i18n/ko.json` | ~35개 |
| 기타 언어 파일 (`i18n/*.json`) | 각 150~300개 |

### 3. 설정 파일

| 파일 | 수정 대상 |
|-----|---------|
| `server/config/config.json` | SiteName, SiteURL, 기본값 |
| `webapp/package.json` | 패키지 이름, 설명 |
| `webapp/platform/*/package.json` | 패키지 이름 |

### 4. URL/도메인 참조

| 항목 | 현재 값 | 변경 대상 |
|-----|--------|---------|
| URL 스킴 | `mattermost://` | `okrbest://` (옵션) |
| 도메인 | `mattermost.com` | `okr.best` |
| API 엔드포인트 | `api.mattermost.com` | 자체 서버 또는 제거 |
| 알림 서버 | `notices.mattermost.com` | 자체 서버 또는 제거 |

### 5. 패키지/모듈 이름

| 경로 | 현재 이름 |
|-----|---------|
| `webapp/platform/mattermost-redux/` | `@mattermost/redux` |
| `webapp/platform/client/` | `@mattermost/client` |
| `webapp/platform/types/` | `@mattermost/types` |
| `webapp/platform/components/` | `@mattermost/components` |

---

## 라이센스 제한 영역 (주의 필요)

### Enterprise 전용 기능

`server/enterprise/` 폴더의 기능은 Enterprise License 필요:

- `elasticsearch/` - Elasticsearch 통합
- `message_export/` - 메시지 내보내기
- `metrics/` - 메트릭 수집

**⚠️ 이 기능들은 유료 라이센스 없이 프로덕션에서 사용 불가**

### 라이센스 체크 코드

| 파일 | 역할 |
|-----|------|
| `server/channels/app/license.go` | 라이센스 검증 |
| `server/platform/services/license/` | 라이센스 서비스 |
| `server/public/model/license.go` | 라이센스 모델 |

---

## 작업 체크리스트

### Phase 1: 필수 변경

| 작업 | 파일/폴더 | 상태 |
|-----|---------|------|
| 로고 이미지 교체 | `webapp/channels/src/images/` | ⬜ |
| 로고 컴포넌트 수정 | `webapp/.../logo_*.tsx` | ⬜ |
| 이메일 템플릿 로고 | `server/templates/` | ⬜ |
| 사이트명 기본값 변경 | `server/config/config.json` | ⬜ |
| README 수정 | `README.md` | ✅ 완료 |

### Phase 2: UI 텍스트

| 작업 | 파일/폴더 | 상태 |
|-----|---------|------|
| 영문 텍스트 변경 | `webapp/channels/src/i18n/en.json` | ⬜ |
| 한국어 텍스트 변경 | `webapp/channels/src/i18n/ko.json` | ⬜ |
| 기타 언어 텍스트 | `webapp/channels/src/i18n/*.json` | ⬜ |

### Phase 3: 외부 서비스 연동 제거/교체

| 작업 | 설명 | 상태 |
|-----|------|------|
| 알림 서버 URL | `notices.mattermost.com` 제거 | ⬜ |
| 텔레메트리 | Mattermost 서버로 전송 비활성화 | ⬜ |
| 라이센스 서버 | 자체 서버 또는 제거 | ⬜ |

### Phase 4: 선택적 변경

| 작업 | 설명 | 상태 |
|-----|------|------|
| URL 스킴 변경 | `mattermost://` → `okrbest://` | ⬜ |
| 패키지 이름 변경 | `@mattermost/*` → `@okrbest/*` | ⬜ |
| 도메인 전체 교체 | 코드 내 모든 도메인 참조 | ⬜ |

---

## Enterprise 기능 자체 개발

### 개요

Enterprise 기능을 자체 개발하려면 라이센스 체크 로직을 수정하거나 우회해야 합니다.

**⚠️ 주의**: `server/enterprise/` 폴더 코드는 Source Available License 적용으로 프로덕션 사용 시 유료 라이센스 필요. 자체 개발 시 해당 코드 **참조만** 하고 새로 구현해야 법적 위험 최소화.

### Enterprise 기능 목록 (Features 모델)

`server/public/model/license.go`의 `Features` 구조체 기준:

| 기능 | 필드명 | 설명 |
|-----|-------|------|
| LDAP 인증 | `LDAP` | LDAP/Active Directory 인증 |
| LDAP 그룹 | `LDAPGroups` | LDAP 그룹 동기화 |
| MFA | `MFA` | 다중 인증 |
| Google OAuth | `GoogleOAuth` | Google 로그인 |
| Office 365 OAuth | `Office365OAuth` | Microsoft 365 로그인 |
| OpenID Connect | `OpenId` | OpenID Connect 인증 |
| SAML 인증 | `SAML` | SAML 2.0 SSO |
| Compliance | `Compliance` | 규정 준수 감사 |
| Cluster | `Cluster` | 고가용성 클러스터링 |
| Metrics | `Metrics` | Prometheus 메트릭 |
| MHPNS | `MHPNS` | 하이 퍼포먼스 푸시 알림 |
| Elasticsearch | `Elasticsearch` | 검색 엔진 통합 |
| Data Retention | `DataRetention` | 데이터 보관 정책 |
| Message Export | `MessageExport` | 메시지 내보내기 |
| Custom Permissions | `CustomPermissionsSchemes` | 커스텀 권한 스킴 |
| Guest Accounts | `GuestAccounts` | 게스트 계정 |
| Enterprise Plugins | `EnterprisePlugins` | 엔터프라이즈 플러그인 |
| Shared Channels | `SharedChannels` | 조직 간 채널 공유 |
| Advanced Logging | `AdvancedLogging` | 고급 로깅 |

### 라이센스 체크 위치

#### 1. 라이센스 모델
| 파일 | 역할 |
|-----|------|
| `server/public/model/license.go` | `License`, `Features` 구조체 정의 |
| `server/channels/app/license.go` | 앱 레벨 라이센스 메서드 |
| `server/channels/app/platform/license.go` | 플랫폼 레벨 라이센스 관리 |
| `server/channels/utils/license.go` | 라이센스 유틸리티 |

#### 2. 기능별 체크 코드 (서버)
| 기능 | 체크 위치 |
|-----|---------|
| LDAP | `server/channels/api4/ldap.go`, `server/channels/app/ldap.go` |
| SAML | `server/channels/app/login.go`, `server/channels/app/authentication.go` |
| Compliance | `server/channels/app/compliance.go`, `server/config/client.go` |
| Cluster | `server/config/client.go` (L197-202) |
| Elasticsearch | `server/enterprise/elasticsearch/common/indexing_job.go` |
| Data Retention | `server/channels/jobs/`, `server/config/client.go` |
| Message Export | `server/enterprise/message_export/` |
| LDAP Groups | `server/channels/app/post.go` (L530), `server/channels/app/plugin_api.go` |

#### 3. 프론트엔드 체크
| 파일 | 역할 |
|-----|------|
| `webapp/channels/src/selectors/plugins.ts` | 플러그인 라이센스 체크 |
| `webapp/platform/client/src/client4.ts` | API 클라이언트 |
| `webapp/channels/src/utils/constants.tsx` | 라이센스 상수 |

### 플러그인 Enterprise 라이센스 체크

#### 라이센스 등급 체계

| SKU | 상수 | 레벨 |
|-----|------|------|
| E10 (Legacy) | `LicenseShortSkuE10` | Professional (10) |
| E20 (Legacy) | `LicenseShortSkuE20` | Enterprise (20) |
| Professional | `LicenseShortSkuProfessional` | Professional (10) |
| Enterprise | `LicenseShortSkuEnterprise` | Enterprise (20) |
| Enterprise Advanced | `LicenseShortSkuEnterpriseAdvanced` | Advanced (30) |

#### 플러그인 API 라이센스 체크 함수

`server/public/pluginapi/license.go`:

| 함수 | 필요 라이센스 | 설명 |
|-----|-------------|------|
| `IsEnterpriseLicensedOrDevelopment()` | 아무 라이센스 | 라이센스 존재 여부만 확인 |
| `IsE10LicensedOrDevelopment()` | E10/Professional 이상 | LDAP 기능 체크용 |
| `IsE20LicensedOrDevelopment()` | E20/Enterprise 이상 | 고급 기능 체크용 |
| `IsEnterpriseAdvancedLicensedOrDevelopment()` | Enterprise Advanced | 최고급 기능 |
| `IsConfiguredForDevelopment()` | - | 개발 모드 체크 |

#### 플러그인 라이센스 우회 조건

개발 모드 설정 시 라이센스 없이도 사용 가능:
```json
// config.json
{
  "ServiceSettings": {
    "EnableTesting": true,
    "EnableDeveloper": true
  }
}
```

#### 마켓플레이스 Enterprise 플러그인

| 파일 | 역할 |
|-----|------|
| `server/public/model/marketplace_plugin.go` | 마켓플레이스 플러그인 모델 |
| `server/channels/app/plugin.go` | 플러그인 필터링 로직 |

**Enterprise 플러그인 필터 조건** (`HasEnterpriseMarketplacePlugins()`):
- `Features.EnterprisePlugins = true` 또는
- SKU가 E20 또는
- Professional 이상 라이센스

#### 프론트엔드 플러그인 라이센스 체크

`webapp/channels/src/selectors/plugins.ts`:

```typescript
// 라이센스 필요 플러그인 컴포넌트
export const getSearchPluginSuggestions = createSelector(
    getLicense,
    (state) => state.plugins.components.SearchSuggestions,
    (license, components = []) => {
        if (license.IsLicensed !== 'true') {  // 라이센스 체크
            return [];
        }
        return components;
    },
);
```

**라이센스 체크 대상 컴포넌트**:
- `SearchSuggestions` - 검색 제안
- `SearchHints` - 검색 힌트  
- `SearchButtons` - 검색 버튼

#### 플러그인 라이센스 체크 우회 방법

**방법 1: pluginapi 수정** (`server/public/pluginapi/license.go`):
```go
func IsEnterpriseLicensedOrDevelopment(config *model.Config, license *model.License) bool {
    return true  // 항상 true 반환
}
```

**방법 2: 프론트엔드 selector 수정** (`webapp/channels/src/selectors/plugins.ts`):
```typescript
(license, components = []) => {
    // if (license.IsLicensed !== 'true') {
    //     return [];
    // }
    return components;  // 라이센스 체크 제거
}
```

**방법 3: 개발 모드 활성화** (가장 안전):
- `EnableTesting: true`
- `EnableDeveloper: true`

### 자체 개발 전략

#### 방법 1: 라이센스 체크 우회 (가장 단순)

`server/public/model/license.go`의 `SetDefaults()` 수정:

```go
// 모든 기능을 기본값 true로 설정
func (f *Features) SetDefaults() {
    f.FutureFeatures = NewPointer(true)
    f.LDAP = NewPointer(true)
    f.SAML = NewPointer(true)
    // ... 모든 필드를 true로
}
```

#### 방법 2: 자체 라이센스 발급 시스템

1. `server/channels/app/platform/license.go` 수정
2. 자체 라이센스 검증 로직 구현
3. 라이센스 서버 자체 운영

#### 방법 3: 오픈소스 대안 구현

| Enterprise 기능 | 오픈소스 대안 |
|---------------|-------------|
| Elasticsearch | OpenSearch (직접 통합) |
| LDAP | go-ldap 라이브러리 활용 |
| SAML | gosaml2 라이브러리 |
| Metrics | 기본 제공 (Prometheus) |

### 수정 필요 파일 요약

| 범주 | 파일 | 수정 내용 |
|-----|------|---------|
| 라이센스 모델 | `server/public/model/license.go` | Features 기본값 변경 |
| 라이센스 검증 | `server/channels/app/platform/license.go` | 자체 검증 로직 |
| 설정 전파 | `server/config/client.go` | 클라이언트 설정 노출 |
| API 엔드포인트 | `server/channels/api4/license.go` | 라이센스 API |
| 기능별 체크 | 각 기능 관련 파일 | `License().Features.X` 체크 수정 |

### 법적 위험

1. **Source Available License 위반**: `server/enterprise/` 코드 직접 복사 금지
2. **상표권**: "Enterprise" 명칭 사용 주의
3. **특허**: 일부 기능에 특허 존재 가능성

### 권장 접근법

1. 필요한 Enterprise 기능만 선별
2. 해당 기능의 인터페이스만 참조
3. 오픈소스 라이브러리 기반으로 새로 구현
4. 라이센스 체크 부분만 수정

---

## 법적 고려사항

### 반드시 유지해야 하는 것

1. 모든 소스 파일의 저작권 헤더
2. `LICENSE.txt`, `LICENSE.enterprise`, `NOTICE.txt` 파일
3. "Based on Mattermost" 등 출처 표시 (권장)

### 변경 가능한 것

1. 제품명 ("OKR Best")
2. 로고 및 시각적 요소
3. UI 텍스트 중 "Mattermost" 단어
4. 기본 설정값

### 주의사항

- **트레이드마크**: "Mattermost"를 제품명으로 사용 불가
- **Enterprise 기능**: 유료 라이센스 없이 사용 불가
- **소스 공개**: AGPL 조항에 따라 수정 소스 공개 의무

---

## 참고 링크

- [Mattermost Trademark Standards](https://mattermost.com/trademark-standards-of-use/)
- [AGPL v3.0 License](https://www.gnu.org/licenses/agpl-3.0.html)
- [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0)
