# 알림 히스토리 아이템 네비게이션 개선

## 개요

알림 히스토리 패널에서 알림 아이템을 클릭했을 때 해당 포스트로 이동하는 기능을 "바로가기" 메뉴 및 멘션 검색 결과와 동일한 방식으로 개선했습니다.

## 구현 내용

### 변경 사항

1. **네비게이션 방식 변경**
   - 기존: `focusPost` Redux 액션 사용 (복잡한 로직 포함)
   - 변경: `getHistory().push`를 사용하여 permalink URL로 직접 이동

2. **팀 이름 결정 로직 개선**
   - 멘션 검색 결과와 동일한 로직 적용
   - `notification.team_id`로 Redux state에서 팀 정보를 가져옴
   - `team?.name || currentTeam?.name` 사용하여 정확한 팀 이름 보장

3. **코드 간소화**
   - `focusPost` 액션 의존성 제거
   - 더 간단하고 직관적인 네비게이션 로직

### 구현 위치

- 파일: `webapp/channels/src/components/notification_history_panel/notification_history_item.tsx`
- 함수: `navigateToPost`

### 코드 예시

```typescript
// Redux에서 팀 정보 가져오기 (멘션과 동일한 로직)
const currentTeam = useSelector((state: GlobalState) => getCurrentTeam(state));
const team = useSelector((state: GlobalState) => {
    if (notification.team_id) {
        return getTeam(state, notification.team_id);
    }
    return null;
});

const navigateToPost = useCallback(() => {
    if (!notification.post_id) {
        return;
    }

    if (!notification.is_read) {
        onMarkAsRead(notification.id);
    }

    // Navigate to post using permalink URL (same as mention navigation logic)
    // Same logic as PostComponent: team?.name || currentTeam?.name
    const teamName = team?.name || currentTeam?.name || '';

    // Same as mention: getHistory().push(`/${teamName}/pl/${post.id}`)
    getHistory().push(`/${teamName}/pl/${notification.post_id}`);
}, [notification, onMarkAsRead, currentTeam, team]);
```

## 동작 방식

1. **알림 아이템 클릭**
   - 사용자가 알림 히스토리 아이템을 클릭
   - 읽지 않은 알림인 경우 자동으로 읽음 처리

2. **팀 이름 결정 (멘션과 동일한 로직)**
   - `notification.team_id`로 Redux state에서 팀 정보를 가져옴 (`getTeam`)
   - 팀 이름 우선순위: `team?.name || currentTeam?.name`
   - 멘션 검색 결과의 `PostComponent`와 동일한 로직 사용

3. **Permalink URL로 이동**
   - `getHistory().push`를 사용하여 `/{teamName}/pl/{postId}` 형식의 URL로 이동
   - 이는 "바로가기" 메뉴 및 멘션 검색 결과와 동일한 방식

4. **PermalinkView 컴포넌트 처리**
   - React Router가 permalink URL을 감지하고 `PermalinkView` 컴포넌트를 렌더링
   - `PermalinkView`가 `focusPost` 액션을 호출하여 실제 포스트 로딩 및 네비게이션 처리

5. **에러 처리**
   - 삭제된 포스트인 경우: `focusPost`에서 `getPostInfo` 또는 `getPostThread` 실패 시 `/error?type=PERMALINK_NOT_FOUND`로 리다이렉트
   - 접근 불가 포스트인 경우: 동일하게 에러 페이지로 리다이렉트
   - 채널 미가입인 경우: 자동으로 채널 조인 후 포스트로 이동

## 해결한 문제

### 팀 이름 불일치 문제

**문제 상황:**
- 배포 환경에서 알림 히스토리 아이템 클릭 시 포스트로 이동하지 않는 문제 발생
- 서버에서 받은 `notification.team_name`이 'OKR.Best' (대문자, 점 포함) 형식
- 실제 팀 이름은 'okrbest' (소문자)
- URL 라우팅은 팀 이름을 대소문자 구분하므로 `/OKR.Best/pl/...`로 이동하면 라우팅 실패

**원인:**
- 서버에서 받은 `notification.team_name`을 직접 사용
- 멘션 검색 결과와 다른 로직 사용

**해결 방법:**
- 멘션 검색 결과와 동일한 로직 적용
- `notification.team_id`로 Redux state에서 정확한 팀 정보를 가져옴
- `team?.name || currentTeam?.name` 사용하여 Redux에 저장된 정확한 팀 이름 사용

**교훈:**
- 서버에서 받은 `team_name`은 표시용일 수 있으므로, Redux state의 팀 정보를 사용하는 것이 안전
- 다른 기능(멘션)과 동일한 로직을 사용하여 일관성 유지

## 장점

1. **일관성**: "바로가기" 메뉴 및 멘션 검색 결과와 동일한 방식으로 동작하여 사용자 경험 일관성 향상
2. **안정성**: Redux state의 정확한 팀 정보를 사용하여 배포 환경에서도 안정적으로 동작
3. **간소화**: 복잡한 Redux 액션 대신 간단한 URL 네비게이션 사용
4. **유지보수성**: 코드가 더 간단하고 이해하기 쉬움
5. **에러 처리**: 기존 `PermalinkView`의 에러 처리 로직을 그대로 활용

## 참고 사항

### 삭제된 포스트 처리

삭제된 포스트로 이동 시도 시:
- `PermalinkView`가 `focusPost`를 호출
- `focusPost`에서 `getPostInfo` 또는 `getPostThread` 실패
- 자동으로 `/error?type=PERMALINK_NOT_FOUND` 에러 페이지로 리다이렉트
- 사용자에게 포스트를 찾을 수 없다는 메시지 표시

### 관련 컴포넌트

- `webapp/channels/src/components/permalink_view/permalink_view.tsx`: Permalink URL 처리
- `webapp/channels/src/components/permalink_view/actions.ts`: `focusPost` 액션 구현
- `webapp/channels/src/components/post/post_component.tsx`: "바로가기" 메뉴 및 멘션 검색 결과 구현 참고
- `webapp/channels/src/components/post/index.tsx`: 팀 이름 결정 로직 (`mapStateToProps`)

## 변경 이력

- 2024: 알림 히스토리 아이템 네비게이션을 "바로가기" 메뉴와 동일한 방식으로 개선
- 2024: 팀 이름 불일치 문제 해결 - 멘션 검색 결과와 동일한 로직 적용 (Redux state에서 팀 정보 가져오기)