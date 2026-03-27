# 보드/카드 링크 잘못된 리다이렉트 오류 수정

## 배경
- 채널에서 공유된 보드나 카드(plugin-boards/focalboard) 링크 클릭 시 다른 보드로 연결되는 오류 발생
- 링크 URL과 실제 이동 대상이 일치하지 않는 문제

## 목표
- 보드/카드 링크 클릭 시 정확한 대상으로 이동
- 오류 원인 파악 (webapp vs plugin-boards)

## 아키텍처 이해

### plugin-boards (focalboard) 구조
```
[채널 메시지] → [링크 클릭] → [webapp URL 처리] → [새 탭/라우팅] → [focalboard 플러그인]
```

| 구성요소 | 위치 | 역할 |
|---------|------|------|
| focalboard 플러그인 | 별도 저장소 (prepackaged) | 보드 UI, URL 파싱, 라우팅 |
| webapp 연동 | `webapp/channels/src/plugins/` | 플러그인 등록, 링크 전달 |
| URL 처리 | `webapp/.../utils/url.tsx` | 내부/외부 링크 판별 |

### 보드 링크 URL 형식
```
/boards/team/{teamId}/{boardId}
/boards/team/{teamId}/{boardId}/{viewId}/{cardId}
```

## 디버깅 작업 범위

### 1단계: 링크 생성 확인 (원인 파악)

| 작업 | 파일/위치 | 확인 사항 | 상태 |
|------|----------|---------|------|
| 공유된 링크 URL 확인 | 브라우저 개발자 도구 | DOM에서 `href` 또는 `data-link` 값 | ⬜ |
| 복사된 원본 URL 확인 | 보드에서 복사한 링크 | 실제 URL vs 저장된 URL | ⬜ |
| 메시지 원본 데이터 | Redux DevTools | `post.message` 내 링크 텍스트 | ⬜ |

### 2단계: webapp 링크 처리 확인

| 작업 | 파일 | 함수/컴포넌트 | 상태 |
|------|------|--------------|------|
| 보드 링크 새 탭 처리 확인 | `webapp/.../utils/url.tsx` | `shouldOpenInNewTab()` L264 | ⬜ |
| 마크다운 링크 렌더링 | `webapp/.../markdown/renderer.tsx` | `link()` | ⬜ |
| 플러그인 활성화 상태 | `webapp/.../plugins/useGetPluginsActivationState.ts` | `boardsPlugin` | ⬜ |

### 3단계: focalboard 플러그인 확인 (별도 저장소)

| 작업 | 파일 (focalboard repo) | 확인 사항 | 상태 |
|------|----------------------|---------|------|
| URL 파싱 로직 | `webapp/src/router.tsx` | boardId/cardId 추출 | ⬜ |
| 라우트 정의 | `webapp/src/app.tsx` | React Router 설정 | ⬜ |
| 보드 데이터 로딩 | `webapp/src/store/` | 잘못된 보드 로딩 여부 | ⬜ |

## 디버깅 방법

### 브라우저 개발자 도구 확인
```javascript
// 1. Elements 탭에서 링크 요소 확인
// <a href="/boards/team/xxx/yyy" data-link="/boards/team/xxx/yyy">

// 2. Network 탭에서 실제 요청 확인
// - 클릭 후 어떤 URL로 이동하는지
// - focalboard API 호출 확인 (/api/v2/boards/xxx)

// 3. Console에 로그 추가 (webapp)
// webapp/channels/src/utils/url.tsx
console.log('[DEBUG] shouldOpenInNewTab:', url, result);
```

### Redux 상태 확인
```javascript
// Redux DevTools에서 확인
// 1. state.plugins.plugins.focalboard - 플러그인 로드 상태
// 2. state.entities.posts - 메시지 원본 데이터
```

## 의심 원인 체크리스트

| 의심 원인 | 확인 방법 | 담당 영역 | 상태 |
|---------|---------|---------|------|
| URL에 boardId가 잘못 저장됨 | 메시지 원본 확인 | 보드 공유 시점 | ⬜ |
| focalboard URL 파싱 오류 | 플러그인 디버깅 | focalboard 플러그인 | ⬜ |
| 보드 ID↔팀 ID 매핑 오류 | API 응답 확인 | focalboard 백엔드 | ⬜ |
| 캐시된 잘못된 보드 데이터 | 브라우저 캐시/Redux | focalboard 플러그인 | ⬜ |
| 다중 워크스페이스 라우팅 | teamId 일치 여부 | webapp + 플러그인 | ⬜ |

## 범위 외
- focalboard 플러그인 내부 수정 (원인 파악 후 별도 이슈)
- 서버 측 보드 데이터 무결성 (DB 문제인 경우)

## 참고

### webapp (이 저장소)
- `webapp/channels/src/utils/url.tsx` - 보드 링크 새 탭 처리 (L264, L275)
- `webapp/channels/src/plugins/useGetPluginsActivationState.ts` - 플러그인 상태
- `webapp/channels/src/plugins/registry.ts` - 플러그인 등록 (`registerProduct`)
- `server/public/model/plugin_constants.go` - `PluginIdFocalboard = "focalboard"`

### focalboard 플러그인 (별도 저장소)
- GitHub: `mattermost/focalboard` 또는 `mattermost/mattermost-plugin-boards`
- 로컬 설치 경로: `server/dist/plugin-focalboard/` (prepackaged)

### 서버
- `server/channels/app/plugin.go` - focalboard prepackaged 플러그인 (L1039)
- `server/channels/api4/user.go` - `/boards` 라우팅 (L2146)
