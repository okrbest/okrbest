# Phase 1 데이터 모델: 오프라인 도움말 페이지

이 기능은 서버 저장 데이터가 없는 순수 프론트엔드 정적 콘텐츠 기능이다. 아래
"엔티티"는 DB 테이블이 아니라 React 컴포넌트/상태 구조를 설명한다.

## HelpTopic (도움말 주제)

하나의 도움말 페이지가 다루는 주제 단위.

| 필드 | 타입 | 설명 |
|---|---|---|
| `id` | `'messaging' \| 'formatting' \| 'commands' \| 'sending' \| 'mentioning' \| 'attaching'` | 라우트 경로 및 페이지 식별자. `messaging`은 `page` 파라미터가 없을 때의 기본 랜딩(개요) — upstream `help.tsx`의 `default` 분기와 일치 |
| `titleId` | `string` | 브라우저 탭/팝업 제목용 i18n 메시지 id (`use_help_page_title`에서 사용) |
| `component` | React 컴포넌트 | 해당 주제의 본문을 렌더링하는 컴포넌트(`formatting.tsx`, `messaging.tsx` 등) |

**검증 규칙**: `id`는 6개 고정 값 중 하나여야 하며(spec FR-002 — 개요 1 + 상세 주제 5), 이 포크에 존재하지 않는 기능을 설명하는 주제는 추가하지 않는다(spec SC-004).

## HelpEntryPoint (도움말 진입 버튼 상태)

작성창 하단 도움말 버튼의 표시/동작 상태.

| 필드 | 타입 | 설명 |
|---|---|---|
| `visible` | `boolean` | 작성창 렌더링 시 항상 `true`(spec FR-001 — 상시 노출) |
| `onClick` | `() => void` | 클릭 시 도움말 목록/첫 페이지로 이동 트리거 |

**상태 전이**: 클릭 시 `HelpPopoutState.open`이 `true`로 전환되거나(팝업 가능 시), 인앱 라우트로 네비게이션(팝업 불가 시). 작성창의 draft 텍스트 상태는 변경하지 않는다(spec FR-004, SC-002).

## HelpPopoutState (팝업 표시 상태)

| 필드 | 타입 | 설명 |
|---|---|---|
| `blocked` | `boolean` | 브라우저 팝업 차단 여부(`popout_windows.ts`에서 감지) |
| `activeTopic` | `HelpTopic['id'] \| null` | 현재 열려 있는 도움말 주제 |
| `mode` | `'popout' \| 'in-app'` | `blocked`가 `true`면 `'in-app'`으로 강제 전환(spec FR-003, SC-003) |

**검증 규칙**: `blocked === true`일 때 `mode`는 반드시 `'in-app'`이어야 한다(그 반대 조합은 허용되지 않음).

## 관계

```text
HelpEntryPoint --(클릭)--> HelpPopoutState --(activeTopic 결정)--> HelpTopic --(렌더링)--> 도움말 본문(i18n 메시지)
```

외부 API·DB 스키마 변경 없음 — 이 문서는 컴포넌트/상태 설계 참고용이며 `contracts/`는 해당 없음(내부 UI 전용, 외부 인터페이스 없음).
