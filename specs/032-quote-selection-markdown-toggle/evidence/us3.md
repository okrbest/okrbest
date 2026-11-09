# US3 — .md 파일 미리보기 모달 (T028·T029)

## T028 upstream 테스트

[us2.md](us2.md)의 실행에 포함된다. `src/components/code_preview.test.tsx`(되살린 `components/CodePreview markdown files` describe 8건 포함)와 `src/components/file_preview_modal/file_preview_modal.test.tsx`(포크로 옮긴 `drops the loaded content…` 포함)가 통과한다.

```
PASS src/components/file_preview_modal/file_preview_modal.test.tsx (82.292 s)
PASS src/components/code_preview.test.tsx (89.073 s)
```

### 원칙 III — 결함 심기

| # | 심은 결함 | 결과 |
|---|---|---|
| M12 | `code_preview.tsx` `canToggleMarkdownPreview` 항상 false | FAIL code_preview.test.tsx, file_preview_modal.test.tsx (5 failed / 51) |
| M13 | `file_preview_modal.tsx` 전환 버튼 끔(`showMarkdownToggle={false}`) | FAIL file_preview_modal.test.tsx — `should only offer the toggle once the file content has loaded` |

모두 복구 후 원본과 같음.

## T029 실주행 — quickstart 시나리오 6 (11/11 통과)

| 항목 | 결과 | 실측 |
|---|---|---|
| 모달 헤더에 전환 버튼 | PASS | 1개 |
| 기본은 미리보기 | PASS | `Preview:true,Code:false`, [s6-rendered.png](us234-run/s6-rendered.png) |
| 렌더링 결과 | PASS | `h1` 1개 |
| 언어 레이블 없음(미리보기) | PASS | `.post-code__language` 0 |
| 전환해도 상자 크기 같음 | PASS | 미리보기·코드 모두 960×832 |
| 원문은 줄바꿈 | PASS | `code-preview--wrap` |
| 언어 레이블 없음(코드) | PASS | 0. [s6-raw.png](us234-run/s6-raw.png) |
| 파일 하나일 때 화살표 키 후에도 전환 버튼 유지 | PASS | 1개 |
| 다른 .md도 코드로(선택 기억) | PASS | `GUIDE.md` → `Preview:false,Code:true` |
| 코드 블록 선택과 따로 기억 | PASS | 같은 시점 코드 블록은 `Preview:true` |
| 모바일 폭(390px)은 전환 버튼 없이 원문 | PASS | 전환 0, `.code-preview--markdown` 0. [s6-mobile.png](us234-run/s6-mobile.png) |

### 관찰 — Escape 두 번

전환 버튼을 클릭해 포커스가 그 버튼에 있으면, 첫 Escape는 버튼 툴팁만 닫고 두 번째 Escape에 모달이 닫힌다. 모달을 연 직후, 또는 다른 헤더 버튼에 마우스만 올린 상태에서는 Escape 한 번에 닫힌다([us234-run/esc_probe.js](us234-run/esc_probe.js)).

```
A 바로 Escape → 닫힘: true
B 전환 클릭 후 Escape 1회 → 닫힘: false   (tooltip 열림 1 → 0)
B 두 번째 Escape → 닫힘: true
C 다른 헤더 버튼 hover 후 Escape 1회 → 닫힘: true
```

전환 버튼(`markdown_view_toggle.tsx`)은 upstream 원문이고, 툴팁은 포크와 upstream이 같이 쓰는 `@mattermost/shared` `WithTooltip`이다. 포크 변경에서 생긴 동작이 아니라고 판단해 결함으로 분류하지 않았다(upstream 번들에서 직접 비교하지는 않았다).
