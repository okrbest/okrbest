# US4 — 파일 미리보기 헤더와 코드 복사 버튼 (T030·T031·T032)

## T030 스냅샷 재생성 (원형에서 바꿈)

**바꾼 이유.** upstream 스냅샷에는 compass-ui CSS module 해시 클래스(`_icon-button_13ryy_2`, `_icon_1i355_2` 등)와 compass `Icon`의 DOM(`div._icon` > `div._icon__glyph-area` > `svg`)이 박혀 있다. 포크는 compass-ui 대신 `components/compass_shim`을 쓰므로 같은 DOM이 나올 수 없다.

```
$ npm run test -- src/components/file_preview_modal/file_preview_modal_header src/components/file_preview_modal/file_preview_modal_main_nav -u --maxWorkers=4
PASS src/components/file_preview_modal/file_preview_modal_main_nav/file_preview_modal_main_nav.test.tsx (18.165 s)
PASS src/components/file_preview_modal/file_preview_modal_header/file_preview_modal_header.test.tsx (34.963 s)
Tests:       3 passed, 3 total
Snapshots:   3 updated, 3 total
```

재생성 전 게이트에서 이 3건만 새로 실패했다(`FilePreviewModalHeader › should match snapshot the desktop view`·`mobile view`, `FilePreviewModalMainNav › should match snapshot with multiple files`).

upstream 스냅샷(`git show 36ebc1f6fc:<경로>`)과 비교한 결과, 바뀐 것은 둘뿐이다.

1. 버튼 클래스: `_icon-button_13ryy_2 _icon-button--size-medium_… _icon-button--padding-compact_… _icon-button--style-inverted_…` → `compass-shim-icon-button compass-shim-icon-button--size-medium compass-shim-icon-button--padding-compact compass-shim-icon-button--style-inverted`. 뒤에 붙는 `file-preview-modal__icon-button file_preview_modal_main_nav__prev` 등 upstream 클래스는 같다.
2. 아이콘 감싸기: `span._icon-button__icon-slot` > `div._icon._icon--size-20` > `div._icon__glyph-area` > `svg(24)` → `span.compass-shim-icon` > `svg(1em)`. SVG `path`는 같다.

버튼 순서, `id`(`previewArrowLeft` 등), `aria-label`, 툴팁 구조는 같다. SVG 개수도 같다(main_nav 2 = 2).

## T031 버튼 테스트

[us2.md](us2.md)의 실행에 포함된다 — `file_preview_modal_main_actions.test.tsx`(12건), `compass_shim/icon_button.test.tsx`(7건) 통과.

### 원칙 III — 결함 심기

| # | 심은 결함 | 결과 |
|---|---|---|
| M14 | `file_preview_modal_main_actions.tsx` 다운로드 `asChild={false}` | **PASS(못 잡음)** — upstream 단위 테스트에 다운로드 링크 단언이 없다. `asChild` 동작은 `compass_shim` 테스트(`should render its child instead of a button with asChild, like a download link`)가 확인한다. 헤더 배선은 `미검증(단위)` → T032 실주행으로 확인 |
| M15 | 닫기 버튼 `onClick` 제거 | **PASS(못 잡음)** — upstream 단위 테스트에 닫기 클릭 단언이 없다. `미검증(단위)` → T032 실주행으로 확인 |
| M16 | 링크 복사 버튼 `onClick` 제거 | FAIL — `should call public link callback` |

두 빈틈 모두 upstream 코드 그대로의 배선이고 포크는 import 경로만 바꿨다. 단위 테스트를 새로 쓰지 않았다.

## T032 실주행 — quickstart 시나리오 7

라이트 테마와 다크 테마(사용자 테마 설정 API로 Onyx 계열 적용)에서 이미지 2장짜리 글의 미리보기를 열었다.

| 항목 | 라이트 | 다크 | 실측 |
|---|---|---|---|
| 헤더·내비 버튼 36×36 | PASS | PASS | 아이콘 버튼 전부 36×36. [s7-light-hover.png](us234-run/s7-light-hover.png), [s7-dark-hover.png](us234-run/s7-dark-hover.png) |
| 다운로드는 `download` 링크(asChild, M14 확인) | PASS | PASS | `A`, `href`·`download` 있음 |
| 닫기 버튼 hover 배경 | PASS | PASS | 투명 아님 |
| 이전 화살표 툴팁 | PASS | PASS | `Previous`(이전 판의 `Close` 아님, FR-019) |
| 닫기 버튼으로 닫힘(M15 확인) | PASS | PASS | 모달 0 |
| 바깥 클릭으로 닫힘(포크 86e424498e) | PASS | PASS | 모달 0 |
| 휠 확대(포크 136b14d77b) | PASS | PASS | 이미지 400×300 → 571×429 |
| 키보드 `+`/`=` 확대 | FAIL | FAIL | 크기 그대로 |
| 확대 후 끌기 이동 | FAIL | FAIL | 위치 그대로, 놓은 뒤에도 `image_preview--dragging` 남음 |

### 키보드 확대·끌기 실패는 회귀가 아니다

master(94c2e4d376, 이번 작업 전) 번들을 별도 worktree에서 빌드해 서버가 서빙하는 `dist`를 잠시 바꾸고 같은 조작([us234-run/zoom_probe.js](us234-run/zoom_probe.js))을 했다. 결과가 이번 브랜치와 같다([us234-run/zoom-master.txt](us234-run/zoom-master.txt)).

```
master 번들 main.ac4e286a96f478ecaad5.js
start        400 wide, image_preview
after Equal  400 (그대로)
after +      400 (그대로)
after 0      400
after blur + = 400 (그대로)
after 6 wheels 686, image_preview--pannable
after drag   686, 위치 그대로, image_preview--dragging 남음
```

비교 뒤 `dist`를 이번 브랜치 번들(`main.f9db18676189c2b4b1e7.js`)로 되돌렸다. 포크 키보드 확대 단위 테스트(`file_preview_modal.test.tsx` `per-file zoom state`의 키 입력 테스트)는 통과한다. headless Chromium에서만 생기는 일인지, 실제 브라우저에서도 그런지는 확인하지 못했다. 이번 범위 밖이라 기록만 남긴다.
