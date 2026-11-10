# Contract: `@mattermost/shared` 타입 정의 산출물

이 과제에서 바깥에 드러나는 인터페이스는 하나다. 플러그인과 web app이 가져다 쓰는 `@mattermost/shared` 패키지의 **타입 정의 파일**이다. 단계 S3(`a28b09d7`)가 만드는 방식을 바꾼다.

## 바뀌는 것

| 항목 | 현재 | S3 이후 |
|---|---|---|
| 생성기 | Parcel `@parcel/transformer-typescript-types`(+ `@parcel/packager-ts`) | `tsc -p tsconfig.build.json`(TypeScript 7 네이티브) |
| 빌드 스크립트 | `parcel build --no-optimize` | `parcel build --no-optimize && tsc -p tsconfig.build.json && node build/strip_css_imports.mjs dist` |
| Parcel 타입 타깃 | 켜짐 | `"targets": {"types": false}`로 끔 |
| CSS side-effect import | 선언 파일에 `import './x.css';`가 남을 수 있음 | `strip_css_imports.mjs`가 `.d.ts`에서 지운다 |

## 지켜야 하는 것

1. **하위 경로 진입점**: `exports["./*"].types`의 `./dist/*/index.d.ts`가 하위 모듈마다 있어야 한다. 현재 `dist/`의 하위 모듈은 `components`, `context`, `testing`, `types`, `utils`이다. S3 뒤에도 같은 디렉터리마다 `index.d.ts`가 있어야 한다.
2. **CSS import 없음**: `dist/**/*.d.ts` 어디에도 `^import ['"].*\.s?css['"];` 줄이 없어야 한다. 남아 있으면 TypeScript 6+ 소비자가 `skipLibCheck` 없이 TS2882를 받는다.
3. **테스트 파일 제외**: `*.test.ts`, `*.test.tsx`의 선언은 `dist`에 나오지 않는다(`tsconfig.build.json`의 `exclude`).
4. **peer 범위**: `peerDependencies.typescript`는 `^4.3.0 || ^5.0.0 || ^6.0.0 || ^7.0.0`이다. 기존 소비자(TypeScript 5)를 끊지 않는다.

## 알려진 차이

- 루트 `types`(`dist/types.d.ts`)와 `exports["."]`는 Parcel이 하나로 묶은 파일을 가리킨다. 새 방식은 그 파일을 만들지 않는다. 다만 포크와 upstream 모두 `src/index.ts`가 없어서 루트 진입점을 쓰는 곳이 없다. 이 필드는 upstream 그대로 두고, 루트 import가 없다는 것만 확인한다(`grep -rn "from '@mattermost/shared'" webapp/channels/src` 결과 0건).

## 확인 방법

[quickstart.md](../quickstart.md)의 "S3 확인" 절 참조.
