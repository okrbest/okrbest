# Implementation Plan: 이미지 프리뷰 확대·이동 조작 확장

**Branch**: `012-image-preview-zoom-pan` | **Date**: 2026-09-03 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/012-image-preview-zoom-pan/spec.md`

## Summary

이미지 프리뷰에 조작 수단 셋을 더한다 — 드래그 이동, 커서 기준 휠 확대, 키보드 `+`/`-`/`0`. upstream `aa03fae7`(MM-69026)이 넣은 기능이지만 구현은 가져오지 않는다.

**접근 방식**: 현재의 스크롤 방식(이미지의 실제 크기를 바꾸고 컨테이너 스크롤로 넘침 처리)을 **유지하고** 그 위에 조작 셋을 얹는다. upstream의 표시 변형 방식으로 옮기지 않는다. 우리가 지켜야 할 동작 넷(맞춤 배율 자동 축소, 리셋의 맞춤 배율 복귀, 배경 클릭 닫기, 확대 컨트롤 노출 조건)이 전부 현재 방식 위에 서 있어, 옮기면 그 넷을 다시 만들고 다시 검증해야 한다. 근거는 [research.md](./research.md) 결정 1.

부수적으로 우리 코드의 잠복 버그 하나를 고친다. 메시지 수정으로 같은 자리의 첨부가 교체되면 이전 파일의 배율이 새 파일에 남는다([research.md](./research.md) 사실 6, FR-018).

## Technical Context

**Language/Version**: TypeScript 5.6, React 17 계열 클래스·함수 컴포넌트 혼용

**Primary Dependencies**: 없음 — 새 의존성을 더하지 않는다. 표준 DOM 이벤트와 기존 `ZoomSettings` 상수만 쓴다

**Storage**: 해당 없음. 모달이 열려 있는 동안의 화면 상태만 다루며 서버·브라우저 저장소에 남기지 않는다

**Testing**: Jest + React Testing Library (`TZ=Etc/UTC`, `LC_ALL=en_US.UTF-8`). 기존 스냅샷 24건 유지

**Target Platform**: 데스크톱 브라우저. 터치 기기 제스처는 범위 밖(spec.md Assumptions)

**Project Type**: 웹 애플리케이션의 프론트엔드 단독 변경. 서버 무접촉

**Performance Goals**: 끌기·휠 연속 조작 3초 동안 눈에 띄는 멈춤 없음(SC-006). 강제 동기 레이아웃을 일으키지 않는다

**Constraints**:
- 기존 동작 넷을 깨지 않는다(FR-019~022)
- 감싸는 요소를 `<div class="image_preview">`로 유지해 스냅샷 24건을 보존한다
- PDF 경로에 번지지 않는다 — 이미지와 PDF가 배율 상태를 공유하므로 키보드 처리기에 파일 형식 조건이 필요하다

**Scale/Scope**: 파일 5개, 예상 300줄 안팎(테스트 포함). 신규 파일 없음

## Constitution Check

*GATE: Phase 0 전에 통과해야 한다. Phase 1 설계 후 재확인.*

| 원칙 | 적용 | 판정 |
|---|---|---|
| **I. 패키지별 품질 게이트** | webapp만 변경 → `npm run check` + `npm run check-types` + `npm run test`. 기준선을 구현 전에 확보했다 ([baseline-tests.txt](./baseline-tests.txt): 8 suites / 42 tests / 24 snapshots, exit 0, 실패 0건) | **통과** — 기준선이 깨끗해 회귀 판정이 "실패 0건 유지"로 단순하다 |
| **II. npm workspaces 전용** | 새 의존성 없음. `package.json`·lockfile 무변경 | **통과** |
| **III. 실패를 본 테스트만 인정** | 동작을 바꾸는 변경이므로 테스트를 동반한다. quickstart의 13개 항목을 구현 전에 실패시켜 출력을 남긴다. sync 예외(cherry-pick)에 해당하지 않는다 — 이건 자체 구현이다 | **통과** (구현 단계에서 증거 필요) |
| **IV. 라이선스·리브랜드** | 기존 copyright 헤더 유지. 리브랜드 문자열 무접촉 | **통과** |
| **V. i18n 동기화** | **사용자에게 보이는 새 문자열이 없다.** 조작 수단만 더하며 안내 문구·툴팁을 새로 넣지 않는다. `en.json`·`ko.json` 무변경 | **통과** |
| **VI. 브랜치 + Conventional Commits + PR** | `012-image-preview-zoom-pan` 브랜치에서 작업, PR 경유 병합. CODEOWNERS 보호 경로 무접촉 | **통과** |
| **VII. Spec 주도 워크플로** | specify → plan(현재) → tasks → implement. 구현 규율은 `/speckit-implement`의 3-bis에서 `Skill`로 로드해야 걸린다 | **통과** |
| **VIII. 명세 문서 언어와 문체** | 산출물 전부 한국어. 코드 식별자·경로·명령·FR/SC 식별자는 원형 유지 | **통과** |

**위반 없음.** Complexity Tracking 절을 채울 사유가 없어 생략한다.

### Phase 1 설계 후 재확인

설계를 마친 뒤 다시 훑었다. 새로 걸리는 원칙은 없다.

- 원칙 I: 접촉 파일이 5개로 한정돼 게이트 범위가 webapp 하나다. 변함없다.
- 원칙 III: [quickstart.md](./quickstart.md)에 검증 항목 13개를 FR에 대응시켜 적었다. 구현 전 실패 출력을 남길 대상이 명확하다.
- 원칙 V: 계약을 확정하고 다시 봐도 새 문자열이 없다. `image_preview--dragging`은 CSS 클래스라 번역 대상이 아니다.
- 원칙 II: 계약 확정 후에도 새 의존성이 없다. `classnames`는 webapp에 이미 있으나 굳이 쓰지 않고 기존 템플릿 문자열 방식을 유지한다.

## Project Structure

### Documentation (this feature)

```text
specs/012-image-preview-zoom-pan/
├── plan.md                          # 이 파일
├── spec.md                          # 명세
├── research.md                      # Phase 0 — 모델 결정과 조사 사실
├── data-model.md                    # Phase 1 — 화면 상태 구조
├── quickstart.md                    # Phase 1 — 검증 절차
├── baseline-tests.txt               # 구현 전 기준선 (원칙 I)
├── contracts/
│   └── component-contracts.md       # Phase 1 — 컴포넌트 prop 경계
├── checklists/
│   └── requirements.md              # 명세 품질 검증
└── tasks.md                         # Phase 2 — /speckit-tasks가 만든다
```

### Source Code (repository root)

```text
webapp/channels/src/
├── components/file_preview_modal/
│   ├── image_preview.tsx            # 끌기·휠 입력 감지, 이동 위치 복원
│   ├── image_preview.scss           # --dragging 커서 모양 추가
│   ├── image_preview.test.tsx       # 끌기·휠 단위 테스트 추가
│   ├── file_preview_modal.tsx       # 배율·이동 위치·파일 식별자 상태, 키보드 처리
│   ├── file_preview_modal.test.tsx  # 상태 전이·키보드 테스트 추가
│   ├── __snapshots__/               # 갱신 없음이 목표
│   └── popover_bar/                 # 손대지 않는다
└── utils/constants.tsx              # 손대지 않는다 (ZoomSettings 현행 유지)
```

**Structure Decision**: 기존 `file_preview_modal/` 디렉터리 안에서만 고친다. 신규 파일도, 새 디렉터리도 만들지 않는다. 상태는 부모(`FilePreviewModal`)가 소유하고 자식(`ImagePreview`)은 표시와 입력 감지만 맡는 현재 구조를 그대로 따른다 — `scale`이 이미 그렇게 흐르고 있다.

`utils/constants.tsx`를 건드리지 않는 것이 upstream과 갈리는 지점이다. upstream은 `DEFAULT_SCALE_IMAGE 1.0`과 `MAX_SCALE_IMAGE 2.0`을 신설했는데, 우리는 `zoomRatio = scale / DEFAULT_SCALE(1.75)`로 계산해 1.0을 받으면 식이 깨진다([research.md](./research.md) 사실 7).

## 작업 순서

`/speckit-tasks`가 이 뼈대를 과제로 펼친다.

1. **상태 기반 다지기** — `panOffset`, `fileIdentities`를 상태에 더하고 `getFileIdentity`와 초기화 규칙을 넣는다. FR-017, FR-018을 먼저 세워야 나머지가 얹힌다. 잠복 버그도 여기서 잡힌다.
2. **끌기** (US1, P1) — 입력 감지, 5px 임계값, 배경 클릭과의 구분. 단독으로 완결된 개선이다.
3. **휠** (US2, P2) — 커서 기준 계산식, 되읽기 회피, 비수동 리스너로 페이지 스크롤 차단.
4. **키보드** (US3, P3) — 문서 수준 처리기, 입력 칸·조합키·파일 형식 차단.
5. **마감** — 게이트 실행, 실주행 시나리오, SC 실측.

각 단계는 앞 단계에 기댄다. 1을 건너뛰면 2의 이동 위치가 파일 사이에 샌다.

## 위험과 대응

| 위험 | 왜 생기나 | 대응 |
|---|---|---|
| 끌고 나서 모달이 닫힌다 | 배경 클릭 닫기와 끌기가 같은 요소에 걸린다 | 5px 임계값으로 구분([research.md](./research.md) 결정 3). quickstart 시나리오 1-5가 이것만 본다 |
| 휠 조작이 끊긴다 | 크기 변경 뒤 DOM을 되읽으면 강제 레이아웃이 걸린다 | 되읽지 않고 식으로 계산([research.md](./research.md) 결정 2). 끌기는 ref로 직접 써서 재렌더를 없앤다 |
| 스냅샷 24건이 깨진다 | 감싸는 요소를 바꾸면 마크업이 달라진다 | `<div class="image_preview">` 유지를 계약으로 못박았다. 깨지면 갱신 전에 원인부터 본다 |
| PDF에 번진다 | 이미지와 PDF가 배율 상태를 공유한다 | 키보드 처리기에 파일 형식 조건을 건다. 휠·끌기는 `ImagePreview` 안에만 있어 구조적으로 안 번진다 |
| 맞춤 배율이 어긋난다 | 이동 위치를 더하며 리셋 경로가 복잡해진다 | 불변 조건 5개를 [data-model.md](./data-model.md)에 적고 테스트로 직접 확인한다 |

## 범위 밖 재확인

명세가 그은 선을 구현 단계에서 넘지 않는다.

- PDF의 휠·키보드·끌기
- 터치 제스처
- 배율 상한·하한 값 변경
- `popover_bar`의 prop 확장 (쓸 데가 없다)

## Complexity Tracking

Constitution Check에 위반이 없어 비워 둔다.
