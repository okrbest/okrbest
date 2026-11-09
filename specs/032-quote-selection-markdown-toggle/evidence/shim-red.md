# compass_shim RED (T018)

뼈대(`IconButton`이 null 렌더, `Icon`이 null 렌더)에서 실행:

```
$ npm run test -- src/components/compass_shim --maxWorkers=4
FAIL src/components/compass_shim/icon_button.test.tsx (21.132 s)
    ✕ should render a button with the default size, padding and style (55 ms)
    ✕ should apply the given size, padding, style and class name (4 ms)
    ✕ should pass aria attributes, id and click handlers to the button (4 ms)
    ✕ should not call the click handler when disabled (3 ms)
    ✕ should forward its ref to the button so that tooltips can anchor to it (5 ms)
    ✕ should render its child instead of a button with asChild, like a download link (2 ms)
    ✕ should wrap the glyph in a decorative span (3 ms)
Tests:       7 failed, 7 total
```

# compass_shim GREEN (T019)

`components/compass_shim/icon_button.tsx`·`icon.tsx`·`compass_shim.scss` 구현 후:

```
$ npm run test -- src/components/compass_shim --maxWorkers=4
PASS src/components/compass_shim/icon_button.test.tsx (19.408 s)
    ✓ should render a button with the default size, padding and style (63 ms)
    ✓ should apply the given size, padding, style and class name (6 ms)
    ✓ should pass aria attributes, id and click handlers to the button (32 ms)
    ✓ should not call the click handler when disabled (19 ms)
    ✓ should forward its ref to the button so that tooltips can anchor to it (4 ms)
    ✓ should render its child instead of a button with asChild, like a download link (5 ms)
    ✓ should wrap the glyph in a decorative span (1 ms)
Tests:       7 passed, 7 total
```

lint:
- `npx eslint src/components/compass_shim` 처음에 오류 2건(테스트의 `style='inverted'` → `react/style-prop-object`, 내용 없는 `<a>` → `jsx-a11y/anchor-has-content`). upstream `webapp/channels/eslint.config.mjs`는 `react/style-prop-object`의 `allow`에 `IconButton`이 있다(Compass 계보에서 추가). 포크 설정에도 같은 이름을 넣었다. `<a>`에는 사유를 단 `eslint-disable-next-line`. 고친 뒤 오류 0, 경고 6(테스트 안 영어 문자열, formatjs/no-literal-string-in-jsx 경고).
- `npx stylelint src/components/compass_shim/compass_shim.scss` exit 0.

포크에 없는 Compass 토큰 `--duration-moderate`·`--ease-transition`을 `compass_shim.scss`의 `:root`에 정의했다(upstream `markdown_view_toggle.scss`가 쓴다). 값(200ms, `cubic-bezier(0.4, 0, 0.2, 1)`)은 내가 정했다.
- `npm run check-types`: 기준선 13건과 목록 diff 0.
