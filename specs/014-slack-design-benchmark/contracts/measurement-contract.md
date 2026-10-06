# 계측 계약: SC ↔ 실측 항목 대응

구현과 검증 사이의 계약이다. 왼쪽(SC)은 spec.md의 성공 기준, 오른쪽은
`okrbest-design` 계측 하네스가 산출하는 파일·항목이다. 구현이 끝났다는 주장은
이 표의 전 행이 통과했다는 실측 출력으로만 성립한다 (constitution 원칙 I·III).

계측 명령은 [quickstart.md](../quickstart.md)에 있다. 하네스 대상은 로컬 개발
서버로 돌려 측정한다(R12). 기준선(before)과 결과(after)를 같은 명령으로 떠서
대조한다.

## 판정표

| SC | 실측 항목 | 산출 파일 · 필드 | 통과 기준 |
|---|---|---|---|
| SC-001 | 접근성 감사 전 항목 | `capture/metrics-light.json`의 영역별 `contrast` | AA 미달(글자 4.5, 비텍스트 3.0) 0건 |
| SC-002 | 사이드바 글자·활성 항목 대비 | `metrics-light.json` 사이드바 항목 + `states-light.json` 활성 상태 | 글자 ≥ 8.8, 활성 ≥ 7.0, 활성이 사이드바 내 최고 대비 |
| SC-003 | 크롬 3단 명도 | `metrics-light.json`의 영역별 픽셀 최빈색 (팀 레일·상단 헤더·사이드바·본문) | 레일=헤더 < 사이드바 < 본문, 각각 `#EAEAEA`/`#FDFDFD`/`#FFFFFF` ±2 |
| SC-004 | 본문·제목 타이포 | `metrics-light.json` 계산 스타일 (`fontSize`·`lineHeight`·`fontWeight`·`fontFamily`) | 본문 15px/22px, 제목 18px/900/행간 ≥ 1.25, 한글 글리프가 Noto Sans KR로 렌더 |
| SC-005 | 프리셋 5종 의미색 대비 | 프리셋별 `theme-diff.mjs` 재실행 → 테마별 대비 표 | 5종 전부 글자 4.5+, 비텍스트 3.0+ |
| SC-006 | 1024px 본문 폭 | `capture/reflow.json`의 1024 항목 | 본문 ≥ 720px |
| SC-007 | 모달 마감·전환 시간 | `capture/layout-dialog.json` (`borderRadius`·`boxShadow`) + `states-light.json` 전환 | 모서리 8px, 그림자 2겹(헤어라인+드롭), 전환 ≤ 500ms |
| SC-008 | 저장 테마 보존 | 테마 저장 계정으로 재접속 후 `tokens-light.json`의 `--sidebar-bg` | 저장값 그대로 (예: Sapphire `#1543a3`) |

## 보조 판정 (Jest — 코드 수준 계약)

실측 전에 코드 수준에서 같은 계약을 지키는 회귀 테스트. 구현 전 **실패 출력**을
남긴다 (원칙 III).

| 항목 | 테스트 대상 | 단정 |
|---|---|---|
| 프리셋 대비 | `Preferences.THEMES` 6종 × (의미색, 해당 배경) 조합 | WCAG 대비 공식으로 글자 4.5+, 비텍스트 3.0+ |
| 반전 짝 | 6종의 `sidebarTextActiveBorder` × `sidebarTextActiveColor` | 대비 ≥ 7.0 |
| slate 명도 3단 | slate의 `sidebarTeamBarBg`/`sidebarBg`/`centerChannelBg` | 휘도 오름차순 |
| 기본 테마 | `getDefaultTheme()` (환경설정 없음) | `THEMES.slate` 반환 |
| 의미색 폴백 | `setThemeDefaults({})` | 기본값이 흰 배경에서 기준 통과 |

## 기준선 절차

1. 구현 전, 변경 없는 작업 트리에서 하네스 전체를 1회 실행해
   `capture/`를 `baseline/`으로 복사해 둔다.
2. 2026-08-10 계측 문서와 기준선이 다른 항목(예: 모달 모서리)은 기준선 값을
   정본으로 삼고 spec의 해당 수치를 주석으로 갱신한다 (Assumption 1).
3. 구현 후 같은 명령을 실행해 `baseline/`과 field 단위로 대조한다.
   개선 대상 밖 항목의 변화는 회귀로 간주하고 원인을 규명한다.
