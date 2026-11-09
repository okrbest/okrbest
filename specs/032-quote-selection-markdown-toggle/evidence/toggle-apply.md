# 36ebc1f6 적용 (T021~T025)

`git cherry-pick -n 36ebc1f6fc` (2026-11-09, HEAD 7daa28e350 — compass_shim 커밋 뒤)

## T021 import 경로 교체와 버린 파일

- compass-ui를 import하는 4파일(`copy_button.tsx`, `file_preview_modal_main_actions.tsx`, `file_preview_modal_main_nav.tsx`, `markdown_view_toggle/markdown_view_toggle.tsx`)은 `@mattermost/compass-ui/components/icon`·`icon-button` import를 지우고 `components/compass_shim/icon`·`icon_button` import를 `components/` 묶음에 넣었다(eslint import/order). 본문은 그대로다. 4파일 `npx eslint` 오류 0.
- `docs/main/end-user-guide/collaborate/format-messages.mdx`, `share-files-in-messages.mdx`: modify/delete → `git rm`(문서 사이트 계보 제외).

## T022 06ab8d2c 계열 충돌

36ebc1f6 이후 upstream에서 `code_preview.tsx`·`code_preview.test.tsx`·`code_block.test.tsx`·`code_block.tsx`·`syntax_highlighting.tsx`를 고친 커밋은 06ab8d2c(#38680) 하나뿐이고, 포크는 2026-11-05에 이미 받았다(`git log 36ebc1f6fc..upstream/master -- <파일>`). 그래서 충돌난 3파일은 `upstream/master` 판을 그대로 가져왔다.

포크 HEAD와 `upstream/master`의 차이를 확인했다. 토글 코드(36ebc1f6) 말고 다른 것은 `code_preview.tsx`의 `<LoadingSpinner size='24'/>` 하나였다(#39035 Compass 계보, 포크 `LoadingSpinner`는 `size` prop이 없다). 이 줄만 포크 형태 `<LoadingSpinner/>`로 되돌렸다.

```
$ diff <(git show upstream/master:webapp/channels/src/components/code_preview.tsx) webapp/channels/src/components/code_preview.tsx
163c163
<                 <LoadingSpinner size='24'/>
---
>                 <LoadingSpinner/>
```

나머지 4파일은 `upstream/master`와 같다(`diff` 출력 없음).

`spec-docs/upstream/upstream-adapted-divergences.md` "코드 블록 구문 강조 처리 — 마크다운 토글 코드와 테스트를 뺐다" 절의 "버린 것" 표 대조:

| 항목 | 상태 |
|---|---|
| `code_preview.tsx` `isMarkdownFile`, `canToggleMarkdownPreview`, 렌더링 분기, `code-preview--fixed-size` | 되살림(7곳 등장) |
| `code_preview.test.tsx` `components/CodePreview markdown files` describe 8건 | 되살림(line 103, 테스트 8개) |
| `code_block.test.tsx` `ToggleableCodeBlock`, `markdown code blocks` describe | 되살림(line 18, 174) |

## T023 파일 미리보기 모달 병합

`file_preview_modal.tsx` 2구간: theirs의 `translate`·`isDragging`·`getDefaultScaleForFile`은 upstream의 다른 확대·이동 계보다. 포크는 이를 자체 구현(`fitScale`·`panOffset`·`fileIdentities`, 커밋 136b14d77b·86e424498e·36df58b028)으로 대신한다. 포크 필드를 그대로 두고 36ebc1f6의 변경(`content: {fileId, text} | null`, 초기값 `null`)만 얹었다. 36ebc1f6은 그릴 때 `content.fileId === getFileIdentity(현재 파일)`로 낡은 내용을 거르므로 포크의 `getDerivedStateFromProps`는 손대지 않았다.

`file_preview_modal.test.tsx` 1구간: theirs에는 36ebc1f6이 추가한 `drops the loaded content when the shown file is swapped…`와 다른 계보의 `seeds default scale/translate…`(문맥)가 함께 있었다. 앞의 것만 포크 `per-file zoom state` describe로 옮겼다. 포크 헬퍼 `renderModal`을 쓰고 식별자를 포크 형식(`id:a`, upstream은 `f:a`)으로 바꿨다(주석으로 표시). 포크 테스트는 그대로 둔다.

## T024 문맥 혼입 점검

`git show --numstat 36ebc1f6fc`와 `git diff --cached --numstat` 비교 — 49파일 중 43파일이 같다. 다른 6파일:

| 파일 | upstream | 포크 | 이유 |
|---|---|---|---|
| `docs/main/.../format-messages.mdx` | +2 | 없음 | 버림 |
| `docs/main/.../share-files-in-messages.mdx` | +4 | 없음 | 버림 |
| `code_preview.test.tsx` | +145 −0 | +144 −1 | 포크는 06ab8d2c 반영 때 이 파일을 이미 들였다(add/add). −1은 `import CodePreview` 줄이 `canToggleMarkdownPreview`를 함께 가져오는 줄로 바뀐 것 |
| `copy_button.tsx` | +25 | +26 | compass_shim import 묶음 앞 빈 줄 |
| `file_preview_modal.test.tsx` | +149 | +151 | 이식 주석 2줄 |
| `file_preview_modal_main_nav.tsx` | +27 | +28 | compass_shim import 묶음 앞 빈 줄 |
| `markdown_view_toggle.tsx` | +98 | +99 | compass_shim import 묶음 앞 빈 줄 |

`post_markdown.tsx`(같음)에 제외 계보의 `channelKind`가 없음을 확인했다.

## T025 번역

`ko.json`에 `markdown_view_toggle.group` "Markdown 보기", `markdown_view_toggle.raw` "코드", `markdown_view_toggle.rendered` "미리보기"를 키 정렬 위치(`markdown_phone_link.tooltip` 다음)에 넣었다. `generic.previous`("이전")는 이미 있다.
