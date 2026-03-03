# 알림 히스토리 아이템 네비게이션 개선

## 개요

알림 히스토리 패널에서 알림 아이템을 클릭했을 때 해당 포스트로 이동하는 기능을 "바로가기" 메뉴와 동일한 방식으로 개선했습니다.

## 구현 내용

### 변경 사항

1. **네비게이션 방식 변경**
   - 기존: `focusPost` Redux 액션 사용 (복잡한 로직 포함)
   - 변경: `getHistory().push`를 사용하여 permalink URL로 직접 이동

2. **코드 간소화**
   - 미사용 import 제거 (`useDispatch`, `useSelector`, `getCurrentUserId`)
   - `focusPost` 액션 의존성 제거
   - 더 간단하고 직관적인 네비게이션 로직

### 구현 위치

- 파일: `webapp/channels/src/components/notification_history_panel/notification_history_item.tsx`
- 함수: `navigateToPost`

### 코드 예시

```typescript
const navigateToPost = useCallback(() => {
    if (!notification.post_id) {
        return;
    }

    if (!notification.is_read) {
        onMarkAsRead(notification.id);
    }

    // Navigate to post using permalink URL (same as 바로가기 menu)
    const teamName = notification.team_name || '';
    getHistory().push(`/${teamName}/pl/${notification.post_id}`);
}, [notification, onMarkAsRead]);
```

## 동작 방식

1. **알림 아이템 클릭**
   - 사용자가 알림 히스토리 아이템을 클릭
   - 읽지 않은 알림인 경우 자동으로 읽음 처리

2. **Permalink URL로 이동**
   - `getHistory().push`를 사용하여 `/{teamName}/pl/{postId}` 형식의 URL로 이동
   - 이는 "바로가기" 메뉴와 동일한 방식

3. **PermalinkView 컴포넌트 처리**
   - React Router가 permalink URL을 감지하고 `PermalinkView` 컴포넌트를 렌더링
   - `PermalinkView`가 `focusPost` 액션을 호출하여 실제 포스트 로딩 및 네비게이션 처리

4. **에러 처리**
   - 삭제된 포스트인 경우: `focusPost`에서 `getPostInfo` 또는 `getPostThread` 실패 시 `/error?type=PERMALINK_NOT_FOUND`로 리다이렉트
   - 접근 불가 포스트인 경우: 동일하게 에러 페이지로 리다이렉트
   - 채널 미가입인 경우: 자동으로 채널 조인 후 포스트로 이동

## 장점

1. **일관성**: "바로가기" 메뉴와 동일한 방식으로 동작하여 사용자 경험 일관성 향상
2. **간소화**: 복잡한 Redux 액션 대신 간단한 URL 네비게이션 사용
3. **유지보수성**: 코드가 더 간단하고 이해하기 쉬움
4. **에러 처리**: 기존 `PermalinkView`의 에러 처리 로직을 그대로 활용

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
- `webapp/channels/src/components/post/post_component.tsx`: "바로가기" 메뉴 구현 참고

## 변경 이력

- 2024: 알림 히스토리 아이템 네비게이션을 "바로가기" 메뉴와 동일한 방식으로 개선
