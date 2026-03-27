# @멘션 입력창 표시명 변경

## 배경
- 현재 @멘션 시 username(ID)이 표시되어 사용자 식별이 어려움

## 목표
- 입력창에서 @멘션 선택 시 displayName(이름)으로 표시
- 서버 전송 시 기존대로 username으로 변환

## 작업 범위

| 작업 | 파일 | 함수/컴포넌트 | 담당 | 상태 |
|------|------|--------------|------|------|
| 자동완성 terms에 displayName 적용 | `webapp/.../at_mention_provider.tsx` | `membersGroup()`, `groupsGroup()` | - | ⬜ |
| 완료 시 username 매핑 저장 | `webapp/.../suggestion_box.tsx` | `handleCompleteWord()` | - | ⬜ |
| 멘션 매핑 상태 관리 | `webapp/.../advanced_text_editor.tsx` | `AdvancedTextEditor` | - | ⬜ |
| 전송 시 displayName→username 변환 | `webapp/.../advanced_text_editor.tsx` | `handleSubmit()` | - | ⬜ |
| 멘션 알림 동작 확인 | - | - | - | ⬜ |

## 범위 외
- 서버 측 수정 (`server/channels/app/notification.go`)
- Rich Text(Pill) 방식 전환

## 참고
- `webapp/channels/src/components/suggestion/at_mention_provider/at_mention_provider.tsx`
- `webapp/channels/src/components/suggestion/suggestion_box.tsx`
- `webapp/channels/src/components/advanced_text_editor/advanced_text_editor.tsx`
