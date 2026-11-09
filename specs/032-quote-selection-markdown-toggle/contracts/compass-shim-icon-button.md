# 계약: compass-ui 대체 `IconButton`·`Icon`

위치(research R3):
- `webapp/channels/src/components/compass_shim/icon_button.tsx` → `IconButton`, `type IconButtonProps`
- `webapp/channels/src/components/compass_shim/icon.tsx` → `Icon`

36ebc1f6에서 compass-ui를 import하는 네 파일은 import 경로만 이 모듈로 바꾼다.
- `components/markdown_view_toggle/markdown_view_toggle.tsx`
- `components/copy_button.tsx`
- `components/file_preview_modal/file_preview_modal_main_actions/file_preview_modal_main_actions.tsx`
- `components/file_preview_modal/file_preview_modal_main_nav/file_preview_modal_main_nav.tsx`

## `IconButton` props

upstream 사용처가 쓰는 범위만 맞춘다.

| prop | 타입 | 기본값 | 뜻 |
|---|---|---|---|
| `icon` | ReactNode | (필수) | 보통 `<Icon glyph={...}/>` |
| `size` | `'small' \| 'medium'` | `'small'` | 버튼 크기 |
| `padding` | `'default' \| 'compact'` | `'default'` | 내부 여백. small+default=32px, small+compact=28px, medium+compact=36px |
| `style` | `'default' \| 'inverted'` | `'default'` | inverted는 `--sidebar-text`·`--sidebar-text-rgb`로 색을 정한다 |
| `className` | string | — | 뒤에 붙는다 |
| `aria-label`, `aria-pressed` 등 `aria-*` | — | — | `<button>`에 그대로 넘긴다 |
| `onClick`, `disabled`, `type`, `id`, `data-testid` | — | `type='button'` | `<button>`에 그대로 넘긴다 |
| ref | `HTMLButtonElement` | — | `forwardRef` |

- 렌더 결과는 `<button>` 하나다. 클래스는 `compass-shim-icon-button`, `compass-shim-icon-button--size-{size}`, `--padding-{padding}`, `--style-{style}`, 그리고 `className`이다.
- 아이콘 색은 `--icon-button-fg`가 있으면 그 값을 쓴다(전환 버튼 scss가 덮어쓴다).
- hover 배경은 default에서 `rgba(var(--center-channel-color-rgb), 0.08)`, inverted에서 `rgba(var(--sidebar-text-rgb), 0.16)`이다. 둥근 모서리는 `var(--radius-s)`다. 포커스 링은 `:focus-visible`에서만 보인다.

## `Icon` props

| prop | 타입 | 뜻 |
|---|---|---|
| `glyph` | ReactElement | compass-icons 컴포넌트 |
| `size` | number | 선택. 없으면 버튼 크기에 맞춘다(small 18px, medium 20px) |

렌더 결과: `<span class="compass-shim-icon" aria-hidden="true">{glyph}</span>`.
