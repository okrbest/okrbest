# 다중 이미지 첨부 썸네일 크기 수정

## 배경
- 채널 메시지에 이미지 파일을 2개 이상 첨부하면 썸네일이 작게 표시됨
- 단일 이미지는 크게 표시되지만 다중 이미지는 작은 카드 형태로 표시

## 목표
- 다중 이미지 첨부 시 썸네일 크기 확대
- 이미지 식별 용이성 향상

## 현재 동작 분석

### 단일 vs 다중 이미지 렌더링 차이

| 조건 | 컴포넌트 | 표시 방식 |
|-----|---------|---------|
| 이미지 1개 | `SingleImageView` | 큰 이미지 (최대 350px 높이) |
| 이미지 2개+ | `FileAttachment` (카드) | 작은 썸네일 (64x64px) |

**분기 로직**: `file_attachment_list.tsx` L47-61

```typescript
if (fileInfos.length === 1 && !fileInfos[0].archived) {
    // 단일 이미지 → SingleImageView (큰 이미지)
    return <SingleImageView ... />;
}
// 다중 이미지 → FileAttachment 카드들
```

## 수정 대상 파일

### 1. CSS 스타일 (핵심)

| 파일 | 클래스 | 현재 값 | 역할 |
|-----|-------|--------|------|
| `sass/components/_files.scss` | `.post-image__column` | `width: 320px`, `height: 6.4rem` | 파일 카드 컨테이너 |
| `sass/components/_files.scss` | `.post-image` | `width: 4rem`, `height: 4rem` | 이미지 썸네일 크기 |
| `sass/components/_files.scss` | `.post-image__thumbnail` | `width: 6.3rem` | 썸네일 래퍼 |

### 2. JavaScript 상수

| 파일 | 상수 | 현재 값 | 역할 |
|-----|-----|--------|------|
| `utils/constants.tsx` | `THUMBNAIL_WIDTH` | `128` | 썸네일 너비 판단 기준 |
| `utils/constants.tsx` | `THUMBNAIL_HEIGHT` | `100` | 썸네일 높이 판단 기준 |

### 3. 컴포넌트 파일

| 파일 | 역할 |
|-----|------|
| `components/file_attachment_list/file_attachment_list.tsx` | 파일 목록 렌더링, 단일/다중 분기 |
| `components/file_attachment/file_attachment.tsx` | 개별 파일 첨부 카드 |
| `components/file_attachment/file_thumbnail/file_thumbnail.tsx` | 이미지 썸네일 렌더링 |

## 작업 범위

| 작업 | 파일 | 수정 내용 | 담당 | 상태 |
|------|------|---------|------|------|
| 카드 컨테이너 크기 확대 | `sass/components/_files.scss` | `.post-image__column` height 조정 | - | ⬜ |
| 썸네일 크기 확대 | `sass/components/_files.scss` | `.post-image` width/height 조정 | - | ⬜ |
| 썸네일 래퍼 크기 | `sass/components/_files.scss` | `.post-image__thumbnail` width 조정 | - | ⬜ |
| 반응형 스타일 확인 | `sass/responsive/_mobile.scss` | 모바일 대응 확인 | - | ⬜ |
| 상수 값 조정 (선택) | `utils/constants.tsx` | `THUMBNAIL_WIDTH/HEIGHT` | - | ⬜ |

## 수정 방법

### 방법 1: CSS만 수정 (권장)

**`webapp/channels/src/sass/components/_files.scss`**:

```scss
// 현재 (L328-342)
.post-image__column {
    width: 320px;
    min-width: 204px;
    height: 6.4rem;  // 약 102px
    // ...
}

// 수정 제안
.post-image__column {
    width: 320px;
    min-width: 204px;
    height: 10rem;  // 약 160px로 확대
    // ...
}
```

```scss
// 현재 (L410-419)
.post-image {
    width: 4rem;   // 64px
    height: 4rem;  // 64px
    // ...
}

// 수정 제안
.post-image {
    width: 6rem;   // 96px로 확대
    height: 6rem;  // 96px로 확대
    // ...
}
```

```scss
// 현재 (L453-463)
.post-image__thumbnail {
    width: 6.3rem;  // 약 100px
    // ...
}

// 수정 제안
.post-image__thumbnail {
    width: 8rem;  // 약 128px로 확대
    // ...
}
```

### 방법 2: 상수 수정 (판단 로직 영향)

**`webapp/channels/src/utils/constants.tsx`** (L1578-1579):

```typescript
// 현재
THUMBNAIL_WIDTH: 128,
THUMBNAIL_HEIGHT: 100,

// 수정 제안 (선택)
THUMBNAIL_WIDTH: 192,
THUMBNAIL_HEIGHT: 150,
```

**주의**: 이 상수는 `file_thumbnail.tsx`에서 `small` vs `normal` 클래스 분기에 사용됩니다.

## 관련 파일 상세

### _files.scss 주요 클래스 구조

```
.post-image__columns          // 파일 목록 컨테이너 (flex-wrap)
  └── .post-image__column     // 개별 파일 카드 (320px x 6.4rem)
        ├── .post-image__thumbnail  // 썸네일 영역 (6.3rem)
        │     └── .post-image       // 실제 이미지 (4rem x 4rem)
        └── .post-image__details    // 파일 정보 영역
              └── .post-image__name // 파일명
```

### file_thumbnail.tsx 로직

```typescript
// L47-51
if (width < Constants.THUMBNAIL_WIDTH && height < Constants.THUMBNAIL_HEIGHT) {
    className += ' small';  // 작은 이미지 → 중앙 정렬
} else {
    className += ' normal'; // 큰 이미지 → 좌상단 정렬
}
```

## 범위 외
- 단일 이미지 표시 크기 (`SingleImageView`)
- 이미지 미리보기 모달 크기
- 파일 아이콘 (비이미지 파일)

## 테스트 체크리스트

| 항목 | 확인 사항 |
|-----|---------|
| 이미지 2개 첨부 | 썸네일 크기 확인 |
| 이미지 5개 이상 첨부 | 줄바꿈 레이아웃 확인 |
| 작은 이미지 (100x80px) | `.small` 클래스 적용 확인 |
| 큰 이미지 (1920x1080px) | `.normal` 클래스 적용 확인 |
| 모바일 화면 | 반응형 레이아웃 확인 |
| 이미지+파일 혼합 | 레이아웃 깨짐 없음 확인 |

## 참고 파일

### CSS
- `webapp/channels/src/sass/components/_files.scss` - 핵심 스타일 (L328-463)
- `webapp/channels/src/sass/components/_post.scss` - 게시물 내 파일 스타일
- `webapp/channels/src/sass/responsive/_mobile.scss` - 모바일 스타일

### JavaScript/TypeScript
- `webapp/channels/src/utils/constants.tsx` - `THUMBNAIL_WIDTH/HEIGHT` (L1578-1579)
- `webapp/channels/src/components/file_attachment_list/file_attachment_list.tsx` - 파일 목록 (L47 분기)
- `webapp/channels/src/components/file_attachment/file_thumbnail/file_thumbnail.tsx` - 썸네일 (L47 크기 판단)
- `webapp/channels/src/components/file_attachment/file_attachment.tsx` - 파일 카드
