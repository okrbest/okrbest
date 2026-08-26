# Specification Quality Checklist: 신고 메시지 증거 보고서 UI

**Purpose**: 계획 단계로 넘어가기 전에 명세의 완성도와 품질을 검증한다
**Created**: 2026-08-26
**Updated**: 2026-08-26 (미해결 2건 해소)
**Feature**: [spec.md](../spec.md)

## Content Quality

- [x] 구현 세부(언어·프레임워크·API)를 담지 않았다 — 아래 Notes의 예외 2건 참조
- [x] 사용자 가치와 업무 필요에 집중한다
- [x] 비개발자도 읽을 수 있다
- [x] 필수 섹션을 모두 채웠다

## Requirement Completeness

- [x] [NEEDS CLARIFICATION] 표시가 남아 있지 않다 — 0건
- [x] 요구사항이 검증 가능하고 모호하지 않다 — FR 26건
- [x] 성공 기준을 측정할 수 있다 — SC 8건
- [x] 성공 기준이 기술 중립이다
- [x] 수용 시나리오를 모두 정의했다 — User Story 4개, 시나리오 10건
- [x] 예외 상황을 식별했다 — 6건
- [x] 범위 경계가 분명하다 — Out of Scope 섹션
- [x] 의존성과 가정을 밝혔다

## Feature Readiness

- [x] 기능 요구사항마다 수용 기준이 분명하다
- [x] 사용자 시나리오가 주요 흐름을 덮는다
- [x] 성공 기준에 정의한 결과를 기능이 충족한다
- [x] 구현 세부가 명세로 새어 들지 않았다 — Notes 예외 참조

## okrbest 고유 점검

- [x] 용어 제약을 요구사항으로 못박았다 — FR-019·FR-020, SC-005
- [x] i18n 동시 갱신을 요구사항에 넣었다 — FR-021, SC-006 (constitution 원칙 V)
- [x] 기존 용어 오염 정리를 범위에 포함했다 — FR-022
- [x] 제외 커밋 의존 관계를 Dependencies에 명시했다 — `f1b9aa052e`
- [x] 명세를 한국어로 작성했다 — constitution 원칙 VIII

## 해소된 미해결 항목

- **FR-024 라이선스 게이트** → 옵션 A. 기존 `MinimumEnterpriseAdvancedLicense` 게이트를 유지한다. upstream과 코드 정렬을 얻는 대신, 라이선스가 없는 배포에서는 기능이 화면에 나타나지 않는다. 게이트 정책 변경은 별도 과제로 분리했다(Out of Scope).
- **FR-025 삭제 후 보고서 접근** → 옵션 A. 삭제 후에도 내려받기를 허용한다. 원문이 빠진 보고서가 나올 수 있고, 삭제 전 확인 문구(FR-007)로 사전에 알린다. FR-026과 SC-008로 명문화했다.

## Notes

- **구현 세부 예외 2건**: FR-022가 파일 경로(`server/channels/app/content_flagging_report.go`)를, FR-024가 라이선스 상수명(`MinimumEnterpriseAdvancedLicense`)을 명시한다. 둘 다 고칠 대상과 따를 게이트를 모호함 없이 지목하기 위한 것이다. 이 명세는 기존 코드를 손보는 포크 유지보수 작업이라, 대상을 추상적으로 쓰면 계획 단계에서 다시 찾아야 한다. 의도적으로 남긴다.
- 계획 단계 진입 준비 완료. `/speckit-plan`으로 넘어갈 수 있다.
