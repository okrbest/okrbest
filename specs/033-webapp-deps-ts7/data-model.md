# Data Model: webapp 의존성 2026-10·11 갱신과 TypeScript 7.0 전환

이 과제는 데이터베이스나 API 스키마를 바꾸지 않는다. 대신 작업이 다루는 기록 단위를 정의한다. 구현 과제와 검증은 이 단위로 판정한다.

## 1. 반영 단계 (Stage)

| 필드 | 값 |
|---|---|
| `id` | `S1`(10월분), `S2`(11월분), `S3`(TypeScript 7) |
| `upstream` | `4ca793bd9e78bc5b6055a7e0e4560849792f7dbe`, `20c15b9d2be5c7409a16b6831b5979de76812d4f`, `a28b09d787b0697e294c1efe916f4765002a0636` |
| `depends_on` | S2 → S1, S3 → S2 |
| `commit` | 단계마다 커밋 1개. 본문에 `Upstream:` 링크 1줄 |

**상태 전이**: `대기` → `버전 옮김` → `lockfile 재생성` → `소스 반영` → `스냅샷 재생성·검토` → `게이트 비교 통과` → `커밋`. 게이트 비교에서 새 실패가 있으면 `소스 반영`으로 돌아간다.

## 2. 버전 변경 항목 (VersionChange)

| 필드 | 설명 |
|---|---|
| `file` | `webapp/package.json`, `webapp/channels/package.json`, `webapp/platform/{client,components,eslint-plugin,mattermost-redux,shared,types}/package.json` 중 하나 |
| `section` | `dependencies` / `devDependencies` / `peerDependencies` / `overrides` |
| `name` | 패키지 이름 |
| `upstream_before`, `upstream_after`, `fork_current` | 세 값 |
| `decision` | `apply` / `skip` |
| `reason` | `skip`이면 필수 |

**검증 규칙**

- `fork_current == upstream_before`이면 `apply`(값 = `upstream_after`).
- 패키지가 TipTap 계열(`@tiptap/*`)이거나 `@mattermost/compass-ui`이면 `skip`.
- `fork_current`가 없고 패키지가 포크에서 의도적으로 제거된 것이면 `skip`(예: `@deanwhillier/jest-matchmedia-mock` override, `b04f29a892`).
- `fork_current`가 `upstream_after`보다 높으면 `skip`(낮추지 않는다).
- 그 밖에 `fork_current != upstream_before`이면 사람이 판단하고 `reason`을 남긴다.

**단계별 규모**(R1): S1 129건 중 apply 118·skip 11, S2 28건 중 apply 18·skip 10, S3 21건 전부 apply.

## 3. 소스 변경 항목 (SourceChange)

| 필드 | 설명 |
|---|---|
| `stage` | S1~S3 |
| `path` | 파일 경로 |
| `fork_has_file` | 있음/없음 |
| `apply_mode` | `clean`(그대로 적용) / `manual`(문맥이 달라 손으로 적용) / `skip` |
| `note` | manual·skip 사유 |

**R3 결과 요약**: S1 clean 7·skip 4(TipTap)·patch 교체 1, S2 clean 3·manual 1(`cel_editor/editor.tsx`), S3 clean 13(신규 3 포함)·manual 1(`components/rollup.config.js`).

## 4. 기준선 (Baseline)

| 필드 | 설명 |
|---|---|
| `gate` | `check-types` / `eslint` / `stylelint` / `jest` / `build` |
| `captured_at` | 커밋 해시 |
| `entries` | 실패 항목 목록(파일·규칙·메시지). 빌드는 성공 여부와 산출물 크기 |

**판정 규칙**: 단계 후 목록 − 기준선 목록 = 새 실패. 새 실패가 0건이어야 단계를 커밋한다. 기준선에만 있던 항목(사라진 실패)은 허용하고 기록한다.

## 5. 스냅샷 변경 기록 (SnapshotReview)

| 필드 | 설명 |
|---|---|
| `stage` | S1~S3 |
| `file` | `.snap` 파일 |
| `in_upstream_list` | upstream 같은 커밋이 이 파일을 바꿨는가 |
| `cause` | 원인 요약(예: "react-select 5.10 aria 속성 추가") |

**검증 규칙**: 바뀐 스냅샷 100%에 `cause`가 있어야 한다. `in_upstream_list = false`인 파일은 포크 고유 화면이므로 원인을 따로 확인한다.

## 6. 제외 기록 (Divergence)

`spec-docs/upstream/upstream-adapted-divergences.md`에 남길 항목. 단계별로 `skip`된 VersionChange와 SourceChange, `manual` 적용의 차이점을 기존 형식(인덱스 행 + 상세 절, "버린 것"·"우리 맞춤" 표)으로 쓴다.
