# Phase 0 연구: 오프라인 도움말 페이지

## 1. 팝업 창 구현 방식

- **Decision**: 기존 `popout_controller.tsx`/`popout_windows.ts`의 팝업 인프라(다른 팝업 기능이 이미 사용 중인 `window.open` 기반 라우팅)를 재사용하고, 도움말 라우트를 새 팝업 타입으로 등록한다. 팝업이 브라우저 설정으로 차단되면 `root.tsx`에 등록한 인앱 라우트로 폴백한다.
- **Rationale**: 이미 검증된 팝업 인프라가 존재하므로 새 팝업 매커니즘을 만들 필요가 없고, upstream 원본(MM-61383)도 동일한 접근을 사용했다. 인앱 폴백 라우트를 함께 두면 팝업 차단 여부와 무관하게 기능이 100% 동작한다(spec SC-003).
- **Alternatives considered**:
  - 모달(오버레이) 방식만 제공: 작성 중인 다른 창 작업과 병행하기 어렵고 upstream과 UX가 달라져 제외.
  - 완전히 새로운 팝업 매니저 구현: 기존 인프라 재사용 대비 이점 없이 복잡도만 증가하여 제외.

## 2. 도움말 콘텐츠 확보 전략 — cherry-pick 기반

- **Decision**: upstream 커밋 `37ec26b81a0d13c264ffd6afd6370bc83115307d`을 **`git cherry-pick -x`로 그대로 반영**한다(6개 화면 — `messaging.tsx`(기본 랜딩 개요) + `formatting`/`commands`/`sending`/`mentioning`/`attaching` 전부 포함, merge-tree 충돌 없음 확인됨). 컴포넌트를 spec-kit 태스크로 처음부터 재작성하지 않는다. cherry-pick 직후 다음을 adapt 후속 커밋으로 적용한다: (a) 6개 화면 전체의 제품명 OKR.BEST 치환(FR-005), (b) en.json 134개 키 대응 ko.json 전체 번역(FR-006), (c) 이 포크에 존재하지 않는 기능/설정 언급 제거(FR-007).
- **Rationale**: upstream 코드는 이미 실사용자 대상으로 검증되었고 merge-tree가 CLEAN이므로, 새로 구현하기보다 그대로 가져오는 것이 정확도와 속도 면에서 압도적으로 유리하다. 처음 계획했던 "spec-kit 태스크로 재구현" 접근은 `/speckit-analyze` 과정에서 `messaging.tsx`(6번째 화면) 누락이라는 실제 오류를 낳았다 — cherry-pick 기반으로 전환하면 이런 전사(轉寫) 오류 자체가 구조적으로 발생하지 않는다.
- **Alternatives considered**:
  - spec-kit 태스크로 컴포넌트를 새로 작성: 이미 `/speckit-analyze`에서 6번째 화면 누락 오류가 실증되어 위험성 확인, 제외.
  - 외부 문서 링크로 대체: spec에서 이미 "자체 도움말 페이지 구현"으로 방향이 정해졌으므로(사용자가 spec 진행을 확정) 해당하지 않음.

## 3. i18n 번역 방식

- **Decision**: en.json에 upstream 원문 기준 신규 키 134개를 추가하고, 동일 커밋/PR 안에서 ko.json에 전체 한국어 번역을 함께 작성한다(spec FR-006, constitution 원칙 V).
- **Rationale**: 도움말 본문 텍스트가 i18n 메시지로 구성되어 있어(react-intl `FormattedMessage`), en/ko 동시 작성이 아니면 배포 시 한국어 사용자에게 영어 원문이 노출된다. spec에서 이미 "전체 번역 완료" 방향으로 확정했다.
- **Alternatives considered**: 우선 영어만 배포 후 후속 번역 — spec Question 2에서 사용자가 명시적으로 기각(옵션 B/C 대신 A 선택).

## 4. 제품명 리브랜드 치환

- **Decision**: 도움말 본문 내 "Mattermost" 제품명 언급(원본 10건)을 전면 "OKR.BEST"로 치환한다. Copyright 헤더(`Copyright (c) 2015-present Mattermost, Inc.`)와 라이선스 관련 문구는 constitution 원칙 IV에 따라 치환 대상에서 제외한다(상표/제품명 언급과 저작권 고지는 별개).
- **Rationale**: spec Question 1에서 사용자가 옵션 A(전면 치환)를 선택했다. 리브랜드 일관성을 위해 도움말 화면에 "Mattermost"가 노출되는 것을 방지한다.
- **Alternatives considered**: 부분 치환(기술적 출처만 유지) — 사용자가 선택하지 않음.

## 해결된 NEEDS CLARIFICATION

Technical Context에는 미해결 NEEDS CLARIFICATION이 없다 — spec.md 단계에서 이미 두 건(리브랜드 범위, 번역 범위)이 사용자 확인으로 해소되었고, 본 문서에서 그 구현 방식을 구체화했다.
