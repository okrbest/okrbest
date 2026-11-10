# Quickstart: webapp 의존성 2026-10·11 갱신과 TypeScript 7.0 전환 검증

단계(S1~S3)마다 아래를 돌리고 기준선과 비교한다. 단계 정의와 판정 규칙은 [data-model.md](data-model.md), 근거는 [research.md](research.md)에 있다.

## 0. 전제

```bash
cd webapp
node -v   # v24.11.1
npm -v    # 11.6.2   (engines·.npmrc engine-strict와 일치해야 한다)
```

기준선 저장 위치: `specs/033-webapp-deps-ts7/baseline/`(작업 중 산출물, 커밋하지 않아도 된다. 비교 결과 요약만 커밋 본문·PR에 남긴다).

## 1. 기준선 저장 (구현 전, 한 번)

```bash
B=specs/033-webapp-deps-ts7/baseline; mkdir -p $B
(cd webapp && npm run check-types 2>&1) | grep -E "error TS" | sed -E 's/\([0-9]+,[0-9]+\)//' | sort -u > $B/tsc.txt
# eslint·stylelint는 줄 번호를 빼고 "파일 + 규칙 id"로 저장한다 (의존성 갱신으로 줄이 밀려도 오탐이 나지 않게)
(cd webapp/channels && npx eslint ./src eslint.config.mjs --quiet --format json 2>/dev/null) | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{for(const f of JSON.parse(s))for(const m of f.messages)if(m.severity===2)console.log(f.filePath.replace(/.*webapp\/channels\//,"")+" "+m.ruleId)})' | sort -u > $B/eslint.txt
(cd webapp/channels && npx stylelint "**/*.{css,scss}" --formatter json 2>&1 >/dev/null; true) | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{for(const f of JSON.parse(s))for(const w of f.warnings)console.log(f.source.replace(/.*webapp\/channels\//,"")+" "+w.rule)}catch(e){}})' | sort -u > $B/stylelint.txt
(cd webapp && npm run test 2>&1) | grep -E "^\s*(FAIL|✕)" | sed -E 's/\([0-9.]+ m?s\)//' | sort -u > $B/jest.txt
(cd webapp && npm run build 2>&1 | tail -5; du -sh channels/dist) > $B/build.txt
node -e 'const p=require("./webapp/package-lock.json").packages;for(const k in p)if(p[k].peer)console.log(k)' | sort > $B/peer.txt
```

eslint·stylelint 명령은 `npm run check:eslint`·`check:stylelint`와 같은 설정 파일을 읽는다. 처음 저장할 때 항목 수가 `npm run check` 출력(106·68건)과 맞는지 한 번 대조한다(stylelint는 JSON을 stderr로 내므로 리다이렉트 순서를 지킨다).

기대값: `tsc.txt` 5줄(research R7 표의 5파일).

## 2. 단계마다 돌리는 검증

```bash
# (a) lockfile 재현성: 다시 만들어도 diff가 없어야 한다 (CI 검사와 같다)
cd webapp && npm install --package-lock-only --ignore-scripts --no-audit --no-fund && git diff --exit-code -- package-lock.json

# (b) peer 표시 목록 비교 (사라진 항목만 출력)
comm -23 ../$B/peer.txt <(node -e 'const p=require("./package-lock.json").packages;for(const k in p)if(p[k].peer)console.log(k)' | sort)   # 의존성 갱신으로 빠진 패키지 외에는 0줄

# (c) 게이트 목록을 같은 방식으로 다시 뽑아 기준선과 diff
comm -13 ../$B/tsc.txt <(npm run check-types 2>&1 | grep -E "error TS" | sed -E 's/\([0-9]+,[0-9]+\)//' | sort -u)   # 출력 0줄이어야 한다
# eslint·stylelint·jest도 §1과 같은 명령으로 목록을 다시 뽑아 comm -13으로 새 항목 0줄을 확인한다

# (d) 스냅샷 재생성 후 바뀐 파일 목록
npm run test -- -u && git diff --name-only -- '*.snap'
```

판정: (a) diff 없음, (c) 모든 게이트 새 항목 0줄, (d) 바뀐 스냅샷마다 원인을 기록.

## 3. 단계별 추가 확인

### S1 확인 (`4ca793bd`)

- `webapp/patches/@types+react-bootstrap+0.32.35.patch`가 없고 `0.32.37.patch`가 있다. `npm install` 출력에 patch-package 적용 메시지가 나온다.
- `grep -c '"@tiptap/' webapp/channels/package.json` → 0
- `node -e "console.log(require('./webapp/node_modules/typescript/package.json').version)"` → `5.9.3`

### S2 확인 (`20c15b9d`)

- `grep -n "editContext: false" webapp/channels/src/components/admin_console/access_control/editors/cel_editor/editor.tsx` → 1줄
- `cd webapp/channels && npx jest src/utils/performance_telemetry` 통과(web-vitals 6 INP 타입)
- `cd webapp && npm run build` 성공(monaco 0.57 webpack 플러그인 경로)

### S3 확인 (`a28b09d7`)

```bash
cd webapp
npx tsc -v                                   # Version 7.0.2
node -e "console.log(require('typescript/package.json').version)"   # 6.0.2 (도구용 API)
node -e "const l=require('./package-lock.json').packages; console.log(!!l['node_modules/@typescript/typescript-linux-x64'], !!l['node_modules/@typescript/typescript-darwin-arm64'])"   # true true
npm run build --workspace=platform/shared
ls platform/shared/dist/{components,context,testing,types,utils}/index.d.ts   # 5개 모두 있다
grep -rlE "^import ['\"][^'\"]+\.s?css['\"];" platform/shared/dist --include='*.d.ts' | wc -l   # 0
```

계약 상세: [contracts/shared-package-types.md](contracts/shared-package-types.md).

## 4. 마감 확인

```bash
cd webapp && npm ci && npm run check-types && npm run test && npm run build
SYNC_BASE_BRANCH=HEAD .specify/scripts/bash/upstream-sync.sh update   # 저장소 루트에서
```

- 장부의 spec 전환 미구현 항목이 8 → 5건(SC-007). 확인은 master 커밋 본문 grep으로 한다(spec 부록 행은 남는다):
  `for h in 4ca793bd 20c15b9d a28b09d7; do git log HEAD --oneline --grep="$(git rev-parse $h)" | head -1; done` → 3줄 모두 나와야 한다.
- 브랜치 CI의 webapp 잡이 master 기준선보다 새로 실패하지 않는다(SC-008).
