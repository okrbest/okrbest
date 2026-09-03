# Phase 1 계약: 컴포넌트 경계

**대상 명세**: [spec.md](../spec.md) | **데이터 모델**: [data-model.md](../data-model.md)

이 기능은 서버 API를 건드리지 않는다. 외부에 드러나는 계약은 컴포넌트 사이의 prop 경계뿐이라 그것만 적는다.

## `ImagePreview`

`webapp/channels/src/components/file_preview_modal/image_preview.tsx`

### 지금

```ts
interface Props {
    fileInfo: FileInfo;
    canDownloadFiles: boolean;
    scale?: number;
    onAutoScale?: (nextScale: number) => void;
    onBackgroundClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
}
```

### 바뀐 뒤

```ts
interface Props {
    fileInfo: FileInfo;
    canDownloadFiles: boolean;
    scale?: number;
    onAutoScale?: (nextScale: number) => void;
    onBackgroundClick?: (e: React.MouseEvent<HTMLDivElement>) => void;

    // 새로 더하는 것
    fitScale?: number;
    panOffset?: {x: number; y: number};
    onPanChange?: (offset: {x: number; y: number}) => void;
    onWheelZoom?: (delta: number, cursor: {x: number; y: number}, viewport: {width: number; height: number}) => void;
}
```

### 계약 규칙

| prop | 규칙 |
|---|---|
| `scale` | 없으면 `ZoomSettings.DEFAULT_SCALE`. 기존과 같다 |
| `fitScale` | 없으면 `scale`과 같다고 본다. 끌기 가능 여부 판정(`scale > fitScale`)에 쓴다 |
| `panOffset` | 없으면 `{x: 0, y: 0}`. 렌더 뒤 감싸는 요소의 스크롤 위치로 복원한다 |
| `onPanChange` | 끌기가 끝날 때(`mouseup`) 최종 위치로 한 번만 부른다. 끄는 중에는 부르지 않는다 |
| `onWheelZoom` | 한 프레임에 최대 1회 부른다(자식이 rAF로 묶는다). 배율 계산은 부모가 한다 — 자식은 입력과 기하 정보만 넘긴다 |
| `onBackgroundClick` | 끌기로 판정된 동작 뒤에는 부르지 않는다 (FR-005) |

**책임 분리**: 배율과 이동 위치의 *값*은 부모(`FilePreviewModal`)가 소유한다. `ImagePreview`는 표시와 입력 감지만 맡는다. 지금 `scale`을 부모가 들고 있는 구조를 그대로 따른다.

**`oldScroll`은 어디서 오나**: 커서 기준 계산식([research.md](../research.md) 결정 2)에 필요한 `oldScroll`을 `onWheelZoom`이 넘기지 않는다. 부모가 **`state.panOffset[imageIndex]`를 `oldScroll`로 쓴다.** 이 값이 최신인 근거는 끌기가 `mouseup`에서 `onPanChange`로 항상 상태에 반영되고, `mouseup`이 뒤따르는 어떤 휠 입력보다 먼저 일어나기 때문이다. 자식이 DOM 스크롤을 직접 만지는 구간은 끌기 진행 중뿐이며 그 사이에는 휠 계산이 끼어들지 않는다.

### 마크업 계약

감싸는 요소는 `<div class="image_preview">`를 유지한다. 기존 스냅샷이 여기 묶여 있어 바꾸면 갱신이 따라온다 (spec.md 의존과 제약).

- 확대돼 넘칠 때 `image_preview--zoomed`가 붙는다. 뜻은 지금과 같다 — "스크롤 켜기".
- 끌기 중에는 `image_preview--dragging`이 붙는다. 커서 모양을 바꾸는 용도다.
- 이미지에는 `image_preview__image`와 `data-testid="imagePreview"`를 유지한다.

## `PopoverBar`

`webapp/channels/src/components/file_preview_modal/popover_bar/popover_bar.tsx`

**바꾸지 않는다.**

upstream은 `defaultScale`/`maxScale` prop을 더했다. 파일 형식마다 기준 배율을 다르게 쓰려던 것인데, 우리는 이미지·PDF가 `DEFAULT_SCALE 1.75` 하나를 공유한다(research.md 사실 7). 쓰지 않을 prop을 미리 넣지 않는다.

## `FilePreviewModal`

`webapp/channels/src/components/file_preview_modal/file_preview_modal.tsx`

### 상태 계약

```ts
type State = {
    // ... 기존
    scale: Record<number, number>;
    fitScale: Record<number, number>;

    // 새로 더하는 것
    panOffset: Record<number, {x: number; y: number}>;
    fileIdentities: string[];
}
```

### 정적 도우미

```ts
static getFileIdentity(fileInfo: FileInfo | LinkInfo): string
```

파일 id가 있으면 `id:<id>`, 없으면 `link:<link>`. 접두사로 두 종류를 갈라 우연한 일치를 막는다.

### 키보드 계약

`keydown`을 문서 수준에서 듣되 다음 조건에서 모두 무시한다.

- 현재 파일이 이미지·SVG가 아니다 (PDF 포함 — spec.md 범위 밖)
- `Ctrl`·`Meta`·`Alt` 중 하나가 눌려 있다
- 포커스가 `INPUT`·`TEXTAREA`·`contentEditable` 안에 있다

처리하는 키: `+`, `=` → 확대 / `-` → 축소 / `0` → 리셋. 처리한 입력은 기본 동작을 막는다.

## 변하지 않는 것

회귀 판정의 기준이다.

- `ImagePreview`가 `canDownloadFiles`가 거짓일 때 `<img>` 하나만 돌려주는 동작
- SVG의 `width`/`height: auto` 처리
- 확대 컨트롤이 이미지·SVG·PDF에서 보이는 조건
- PDF 경로(`__scrollable` 컨테이너, `PDFPreview`의 `scale` prop)
- `handleBgClose`의 `e.currentTarget === e.target` 판별 — 끌기 판정이 그 앞에 하나 더 붙을 뿐이다
