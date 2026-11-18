---
description: "서버 배포물에서 포크 플러그인의 공식판을 빼는 작업 목록"
---

# 작업 목록: 서버 배포물에서 포크 플러그인의 공식판을 뺀다

**입력**: `specs/034-unbundle-forked-plugins/`의 [plan.md](plan.md), [spec.md](spec.md),
[research.md](research.md), [quickstart.md](quickstart.md)

**테스트**: 테스트 파일은 만들지 않는다(plan 복잡도 추적). 대신 quickstart Q1~Q3 검사를
**고치기 전에 먼저** 돌려 세 플러그인이 나오는 출력을 남긴다. 고친 뒤 같은 검사로 0건을 확인한다.
증거 출력은 각 과제 바로 아래에 붙인다.

**구성**: 사용자 스토리별로 묶었다. US1(P1)만으로도 운영 문제는 해결된다.

## 형식: `[ID] [P?] [Story] 설명`

- **[P]**: 병렬 가능(다른 파일, 미완료 과제에 의존하지 않음)
- **[Story]**: 해당 사용자 스토리(US1, US2)

---

## Phase 1: 준비 — 고치기 전 증거를 남긴다

**목적**: 원칙 III의 "실패를 먼저 본다". 아래 출력은 모두 코드를 고치기 전에 얻는다.

- [X] T001 `server/Makefile`이 그대로인 상태에서 quickstart Q2를 돌려 일반·FIPS 내려받기 목록을 아래에 붙인다. 기대값: 일반 13개(playbooks·agents·boards 포함), FIPS 3개(셋뿐). 명령: `cd server && make -n prepackaged-plugins | grep -o 'for plugin_package in [^;]*'`, 같은 명령에 `FIPS_ENABLED=true`를 붙여 한 번 더
  - **결과(2026-11-18)**: 일반 13개(`mattermost-plugin-playbooks-v2.11.1`, `-agents-v2.4.2`, `-boards-v9.3.0` 포함). FIPS는 `playbooks-v2.11.1%2B329b65c-fips agents-v2.4.2%2B1305067-fips boards-v9.3.0%2Bd454327-fips` 3개. 원문: [evidence/make-before.txt](evidence/make-before.txt), [evidence/make-fips-before.txt](evidence/make-fips-before.txt)
- [X] T002 [P] `server/build/Dockerfile`이 그대로인 상태에서 quickstart Q1을 돌린다(`docker build --target builder -f Dockerfile -t okrbest-builder-check:before .`, `server/build`에서 실행). `ls /mattermost/prepackaged_plugins` 출력을 `/tmp/prepackaged-before.txt`에 저장하고 세 접두어 grep 개수(기대 6)를 아래에 붙인다. tarball 버전(12.1.0 예상)도 함께 적는다
  - **결과**: 빌드 exit 0. 파일 30개, 세 접두어 6개(`agents-v2.9.0`, `boards-v10.1.0`, `playbooks-v2.12.1`, 각 `-linux-amd64.tar.gz`·`.sig`). 파일 이름이 12.1.0 tarball 목록과 같다. 원문: [evidence/image-prepackaged-before.txt](evidence/image-prepackaged-before.txt)
- [X] T003 [P] 포크 Boards 번들을 만든다: `/mnt/d/okrbest/okrbest-plugin-boards`에서 `make dist`. 산출물 `dist/focalboard-9.2.4.tar.gz` 경로를 아래에 적는다(Node v24 필요)
  - **결과**: 로컬 클론의 기존 `dist/boards-9.2.4.tar.gz`는 2026-07-27 빌드라 nil 가드(`cad38d5c`, 10-11)가 없다. 지금 서버에서 `createBoardsConfig` nil 패닉으로 죽는다(실측). 그래서 `/tmp/boards-main` worktree(`origin/main` `daf80a4e`)에서 `make dist-linux`로 새로 빌드했다 → `/tmp/boards-main/dist/boards-9.2.4.tar.gz`(ID `focalboard`, 9.2.4)
- [X] T004 T003 뒤에 quickstart Q3의 "고치기 전"을 재현한다. `server/prepackaged_plugins`를 지금 Makefile로 채우고, 로컬 서버에 포크 Boards를 `bin/mmctl --local plugin add --force`·`plugin enable`로 올린 다음 서버를 재시작한다. 재시작 뒤 `bin/mmctl --local plugin list`의 `focalboard` 버전(기대 9.3.0)과 로그의 `Removing existing installation` 줄을 아래에 붙인다
  - **절차 변경**: Makefile이 받은 공식 Boards 9.3.0 번들은 manifest에 `version`이 없다. 그래서 기존 포크와 비교하다 `invalid_version`으로 실패해 덮어쓰지 못했다(실측). 운영 경로를 재현하려고 T002 이미지의 `prepackaged_plugins`를 꺼내 썼다. 사용자 개발 서버(8065)와 섞이지 않게 격리 서버(8066, DB `mm_spec034`)에서 돌렸다. quickstart Q3을 같은 방식으로 고쳤다.
  - **사고 기록**: 처음에는 격리 없이 같은 `config.json`으로 띄웠다. 사용자 서버(pid 4463)와 DB·`plugins/`를 약 30초 공유했고, 공식판 처리 전에 내렸다. `plugins/`·`data/plugins/` 내용은 바뀌지 않았다(`focalboard` 9.2.4, 파일 저장소 번들은 백업과 `cmp` 일치). 사용자 서버는 계속 응답했다.
  - **결과**: 포크 9.2.4를 올린 뒤 재시작 1회 → `focalboard` 10.1.0. 로그: `Installing extracted plugin 9.2.4`(sync) → `Installing extracted plugin 10.1.0` → `Removing existing installation of plugin before local install`(existing 9.2.4) → `Table creation / migration failed`(`attachment_id_to_file_id`) → `Unable to activate plugin`. Playbooks 2.12.1·Agents 2.9.0도 공식판으로 깔렸고, Agents는 우리 DB에 마이그레이션 2건(`user_agent_service_account_auth`, `create_channel_autoreply_table`)을 적용했다. 파일 저장소는 9.2.4가 남았다(설치 실패로 persist 단계에 가지 않음). 원문: [evidence/restart-before.txt](evidence/restart-before.txt)

**체크포인트**: T001·T002·T004 출력에 세 공식판이 보여야 한다. 하나라도 안 보이면 구현으로 넘어가지 말고 원인을 먼저 밝힌다(systematic-debugging).

---

## Phase 2: 기반

해당 없음. 두 사용자 스토리가 공유하는 선행 작업이 없다.

---

## Phase 3: 사용자 스토리 1 — 서버를 업데이트해도 포크 플러그인이 그대로 남는다 (우선순위: P1) 🎯 MVP

**목표**: 운영 이미지와 `make` 배포물 모두에서 Playbooks·Boards·Agents 공식판을 뺀다.

**독립 테스트**: quickstart Q1·Q2에서 세 공식판이 0건이고 Q3에서 3회 재시작해도 포크 버전이 그대로면 통과한다.

### 구현

- [X] T005 [P] [US1] `server/build/Dockerfile` builder 단계의 "Remove mattermost server and client" `RUN`(41-44행) 다음에 새 `RUN`을 추가한다. `/mattermost/prepackaged_plugins/mattermost-plugin-{playbooks,boards,agents}-v*`를 `rm -f`로 지우고, 같은 `RUN` 끝에서 세 접두어 파일이 남아 있으면 `exit 1`로 빌드를 실패시킨다. 위에 한국어 주석을 단다. 주석에는 같은 ID 포크를 서버 시작 때 덮어쓰는 사유와 `specs/034-unbundle-forked-plugins`를 적는다. 기존 `RUN`과 tarball 내려받기 단계는 고치지 않는다(plan D1, research R2)
- [X] T006 [P] [US1] `server/Makefile` 일반 `PLUGIN_PACKAGES` 목록에서 `mattermost-plugin-playbooks-v2.11.1`, `mattermost-plugin-agents-v2.4.2`, `mattermost-plugin-boards-v9.3.0` 세 줄을 지운다. 나머지 10줄은 순서·버전을 그대로 둔다. 목록 위(`# Plugins Packages` 아래)에 제외 사유 주석을 단다(plan D2)
- [X] T007 [US1] T006 뒤에 같은 파일 `server/Makefile`의 `ifeq ($(FIPS_ENABLED),true)` 블록 안 세 줄을 `PLUGIN_PACKAGES =` 한 줄로 바꾼다. 블록 자체와 upstream 주석 문단은 남긴다. 블록 안에 "세 공식판을 빼서 비었다, 블록을 지우면 일반 목록을 받는다"는 주석을 단다(research R3)
  - **결과**: T005 — `server/build/Dockerfile` builder 단계 끝에 `RUN rm -f /mattermost/prepackaged_plugins/mattermost-plugin-{playbooks,boards,agents}-v*` + 남은 파일 검사(`ls | grep -E` → `exit 1`)를 더했다. 처음 쓴 `compgen -G '@(...)'` 검사는 `extglob` 없이는 동작하지 않아 고쳤다. T006·T007 — 일반 목록 세 줄 삭제, FIPS 블록은 `PLUGIN_PACKAGES  =`로 비우고 블록은 남겼다. 두 자리에 사유 주석.

### 검증

- [X] T008 [US1] T005 뒤에 quickstart Q1 "고친 뒤"를 돌린다. 태그는 `okrbest-builder-check:after`로 한다. 출력을 `/tmp/prepackaged-after.txt`에 저장하고 세 접두어 개수 0을 확인한다. `diff /tmp/prepackaged-before.txt /tmp/prepackaged-after.txt` 결과가 세 플러그인 6줄 삭제뿐인지 아래에 붙인다(SC-003)
  - **결과**: 빌드 exit 0. tarball 레이어(#5~#8)는 `CACHED`, 새 삭제 단계(#9)만 실행. 파일 30→24개, 세 접두어 0개. `diff`는 `agents-v2.9.0`·`boards-v10.1.0`·`playbooks-v2.12.1`의 `.tar.gz`·`.sig` 6줄 삭제뿐. 남은 파일 검사를 고치기 전 이미지에 돌리면 6개 파일을 출력하고 exit 1로 멈춘다(검사가 실제로 잡는지 확인). 원문: [evidence/image-prepackaged-after.txt](evidence/image-prepackaged-after.txt)
- [X] T009 [P] [US1] T007 뒤에 quickstart Q2 "고친 뒤"를 돌린다. 일반 목록 10개(셋 없음), FIPS 목록 빈 값을 확인하고 출력을 아래에 붙인다(SC-005). FIPS 출력에 일반 목록이 보이면 실패다
  - **결과**: 일반 10개(`calls github gitlab jira zoom mscalendar msteams-meetings metrics channel-export dataminr`), 세 플러그인 0개. 고치기 전과의 diff는 세 줄 삭제뿐. FIPS 목록은 빈 값(0개) — 일반 목록으로 대체되지 않았다. 빈 목록으로 `FIPS_ENABLED=true make prepackaged-plugins` 실제 실행도 exit 0. 원문: [evidence/make-after.txt](evidence/make-after.txt), [evidence/make-fips-after.txt](evidence/make-fips-after.txt)
- [X] T010 [US1] T007 뒤에 quickstart Q3 "고친 뒤"를 돌린다. `server/prepackaged_plugins`를 지우고 `make prepackaged-plugins`로 다시 채운다. 포크 Boards 9.2.4를 올린 상태에서 서버를 3회 연속 재시작한다. 매번 `focalboard` 버전과 덮어쓰기 로그가 없음을 확인하고, 마지막에 브라우저(또는 headless)로 보드 화면이 열리는지 본다. 결과를 아래에 붙인다(SC-001·SC-002)
  - **절차**: T004와 같은 격리 서버(8066)에서 `okrbest-builder-check:after` 이미지의 `prepackaged_plugins`(24개)로 바꿨다(quickstart Q3 개정판).
  - **결과**: 재시작 r1·r2·r3 모두 `focalboard` 9.2.4, `Removing existing installation` 0건, 활성화 오류 0건, 매번 `Installing extracted plugin 9.2.4` → `Plugin activated 9.2.4` → `Boards product successfully started`. 화면 확인용으로 한 번 더 재시작(r4)해도 9.2.4. 파일 저장소 번들도 9.2.4. 재배포 0회. 원문: [evidence/restart-after.txt](evidence/restart-after.txt)
  - **화면**: headless Chromium으로 `/boards` → `/boards/team/<id>` 이동, 페이지 오류 0, Boards UI 요소 4개, "OKR.BEST Boards" 템플릿 화면이 그려졌다: [evidence/boards-after-restart.png](evidence/boards-after-restart.png)
  - **사고 기록 2**: 처음 화면 확인이 빈 화면(CSP `unsafe-eval` 차단)이었다. 원인은 검증 환경이다. `BuildNumber=dev` 없이 빌드한 제 서버 바이너리가 시작할 때 `UpdateAssetsSubpathFromConfig`로 공유 파일 `webapp/channels/dist/root.html`의 CSP 메타를 `script-src 'self'`로 다시 썼다(16:04, 격리 전 실행). 이 파일은 사용자 개발 서버(8065)도 서빙한다. 메타를 webpack 개발 빌드 원래 값 `script-src 'self' js.stripe.com/v3 'unsafe-eval'`로 되돌렸고(diff 1줄), 바이너리를 `-X ...model.BuildNumber=dev`로 다시 빌드했다. `manifest.json`·CSS는 바뀌지 않았다(subpath `/`).

**체크포인트**: US1만으로 운영 문제가 해결된다. 여기서 멈추고 배포해도 된다.

---

## Phase 4: 사용자 스토리 2 — 다음 upstream sync가 공식판을 다시 들이지 않는다 (우선순위: P2)

**목표**: sync 담당자가 문서만 보고 세 플러그인 번들 커밋을 제외할 수 있게 한다.

**독립 테스트**: divergence 문서에 정책 절이 있고, ledger에 세 플러그인 번들 커밋 중 "반영 예정"이 0건이면 통과한다.

### 구현

- [X] T011 [P] [US2] `spec-docs/upstream/upstream-adapted-divergences.md` 끝에 새 절을 추가한다. 제목은 서술문으로 쓴다(예: "## 포크 플러그인 3종 공식 번들 제거 — 운영 이미지와 Makefile 두 경로를 모두 막았다"). 담을 내용은 다음과 같다(plan D3).
  - 두 경로(Dockerfile의 upstream tarball, Makefile `PLUGIN_PACKAGES` 일반·FIPS)
  - 원인 요약과 spec 034 링크
  - ledger 제외 13건(`41e59bf1`, `863d581f`, `f84dd257`, `1bfa2e51`, `dc41b72f`, `10804f80`, `f21b0299`, `1361e922`, `443c6fdf`, `289d5e5e`, `cb4254cc`, `05553d08`, `26ee3a47`)의 재검토 조건이 이 절로 확정됐다는 사실
  - 이후 sync 규칙: 세 플러그인 버전 올림은 계속 exclude한다. 주변 줄 변경은 문맥만 맞춘다
  - 되살릴 조건: 포크 ID 분리, 또는 공식 번들 복귀
- [X] T012 [US2] T011 뒤에 같은 파일 `spec-docs/upstream/upstream-adapted-divergences.md`의 "user-survey 플러그인 번들 제거" 절 표 아래에 한 줄을 덧붙인다. "2026-11-18 spec 034로 playbooks·agents·boards 줄을 목록에서 뺐다 — 위 표의 '포크 값 유지' 열은 그 전 상태다"라는 내용이다
- [X] T013 [P] [US2] `spec-docs/upstream/upstream-master-unmerged-commits.md`에서 T011의 13건이 모두 "제외된 커밋" 절에 있는지, 미반영 표에 세 플러그인 번들 커밋이 없는지 grep으로 확인하고 결과를 아래에 붙인다(FR-007, SC-004). 파일은 고치지 않는다. "반영 예정" 행이 나오면 같은 사유로 제외 처리하고 그 사실을 적는다
  - **결과**: 13건 모두 "제외된 커밋" 절(16행 이후)에 있다. 행 사유에 나온 `751b8cb6`(Agents v2.9.0)도 제외 절(473행)에 있어 실제로는 14건이다. 미반영 표(1~15행)에 세 플러그인 번들 커밋은 0건. 파일은 고치지 않았다. divergence 절의 목록을 14건으로 맞췄다(SC-004 충족).

**체크포인트**: US1·US2가 모두 끝났다.

---

## Phase 5: 마무리

- [X] T014 [P] 메모리 `/home/username/.claude/projects/-mnt-d-okrbest-okrbest/memory/official-plugin-bundle-overwrites-fork.md`를 정정한다. 운영 경로가 Dockerfile의 upstream tarball이라는 사실, spec 034로 두 경로를 모두 막았다는 사실, 이후 sync 규칙을 담는다. `MEMORY.md`의 해당 줄 요약도 맞춘다
  - **결과**: `official-plugin-bundle-overwrites-fork.md`를 정정했다(운영 경로는 Dockerfile tarball, 두 경로 차단, 부수 사실 3개). 검증 중 사고 두 건의 교훈을 `second-server-instance-breaks-dev-env.md`로 새로 남겼다. `MEMORY.md` 두 줄 반영.
- [X] T015 `git diff --stat master`로 바뀐 파일이 계획 범위(`server/Makefile`, `server/build/Dockerfile`, `spec-docs/upstream/upstream-adapted-divergences.md`, `specs/034-unbundle-forked-plugins/`, 에이전트 컨텍스트 3파일, `.specify/feature.json`)뿐인지 확인한다. `server/channels/app/plugin*.go`가 바뀌지 않았는지 본다(FR-008)
  - **결과**: 바뀐 파일은 `server/Makefile`(+6 −6), `server/build/Dockerfile`(+10), `spec-docs/upstream/upstream-adapted-divergences.md`(+39), 에이전트 컨텍스트 3파일·`.specify/feature.json`(각 1줄), `specs/034-unbundle-forked-plugins/` 뿐이다. `git diff --quiet master -- server/channels/app/` 통과(FR-008). 증거 `.log`는 저장소 `.gitignore`(`*.log`)에 걸려 `.txt`로 바꿨다.
- [X] T016 Conventional Commits로 커밋한다. 문서(`docs:`), 빌드 변경(`fix:`)처럼 성격별로 나눈다. PR은 사용자 확인 뒤에 rebase merge 전용으로 연다. PR 본문에 운영 주의를 적는다: 수정본 배포 전에는 재시작하지 않는다, 배포 뒤 플러그인 관리 화면에서 quickstart Q4로 확인한다
  - **결과**: 브랜치 `034-unbundle-forked-plugins`에 3커밋(`docs:` spec 산출물, `fix:` Dockerfile·Makefile, `docs:` divergence 정책 절). push·PR은 사용자 확인 뒤에 한다.

- [X] T017 [US1] (추가 범위, 2026-11-18 사용자 결정) `server/build/Dockerfile` 삭제 `RUN`과 남은 파일 검사에 `google-calendar`를 더한다. 우리 Google Calendar 포크(`com.mattermost.gcal`)가 공식판과 ID가 같다(FR-009)
  - **고치기 전**: 고친 뒤 이미지에 가짜 `mattermost-plugin-google-calendar-v1.0.0-linux-amd64.tar.gz(.sig)`를 넣고 기존 단계를 돌렸다 → `build step passed`, gcal 파일 2개가 남았다(놓친다).
  - **고친 뒤**: 같은 조건에서 새 단계 → 통과, gcal 파일 0개. 실제 `docker build` exit 0, tarball 캐시 재사용, 결과 목록은 이전 24개와 같다(12.1.0에는 gcal 번들이 없음).

---

## 의존 관계와 실행 순서

### Phase 의존

- **Phase 1(준비)**: 바로 시작한다. 모든 구현보다 먼저 끝나야 한다. 고치기 전 증거가 사라지기 때문이다
- **Phase 3(US1)**: Phase 1이 끝난 뒤 시작한다
- **Phase 4(US2)**: Phase 1과 무관하다. US1과 병렬로 해도 된다. 다만 T011 문서가 US1 결과(바뀐 줄)를 적으므로 T006·T007 뒤가 자연스럽다
- **Phase 5**: US1·US2가 끝난 뒤

### 과제 의존

- T004는 T003(포크 번들) 뒤
- T007은 T006 뒤(같은 파일)
- T008은 T002·T005 뒤, T009는 T001·T007 뒤, T010은 T004·T007 뒤
- T012는 T011 뒤(같은 파일)

### 병렬 실행 예

```text
# Phase 1: 서로 다른 대상이라 함께 돌린다
T001 (make -n)   T002 (docker build, 약 400MB 내려받기)   T003 (포크 Boards make dist)

# Phase 3: 서로 다른 파일
T005 (Dockerfile)   T006 → T007 (Makefile)

# Phase 4: US1과 별개 파일
T011 → T012 (divergence 문서)   T013 (ledger 확인)
```

## 구현 전략

### MVP 먼저 (US1만)

1. Phase 1로 고치기 전 증거를 남긴다
2. T005~T007을 고친다
3. T008~T010으로 검증한다
4. 여기서 배포해도 운영 문제가 해결된다

### 이어서

5. US2(T011~T013)로 sync 규칙을 문서에 남긴다
6. 마무리(T014~T016) 뒤 사용자 확인을 받고 PR을 연다

---

## 완료 검증 기록

### 품질 게이트

| 항목 | 명령 | 결과 | 증거 |
|---|---|---|---|
| 서버 Go 게이트 | `make check-style`·`make test-server` | 돌리지 않음 — Go 코드 변경 0(plan 복잡도 추적의 예외). `server/channels/app/` diff 없음 | T015 |
| Dockerfile 빌드 | `docker build --target builder -f Dockerfile .` | exit 0, 새 `RUN`만 실행(tarball 캐시 재사용) | T008 |
| 남은 파일 검사가 잡는가 | 같은 검사를 고치기 전 이미지에 실행 | 6개 파일 출력 후 exit 1 | T008 |
| Makefile FIPS 빈 목록 | `FIPS_ENABLED=true make prepackaged-plugins` | exit 0 | T009 |

### quickstart 종단 검증

| 절 | 고치기 전 | 고친 뒤 | 판정 |
|---|---|---|---|
| Q1 운영 이미지 목록 | 30개 중 세 플러그인 6개 | 24개, 세 플러그인 0개, diff는 6줄 삭제뿐 | 통과 |
| Q2 Makefile 목록 | 일반 13·FIPS 3 | 일반 10·FIPS 0 | 통과 |
| Q3 재시작(격리 서버 8066) | 재시작 1회에 9.2.4 → 10.1.0, 활성화 실패 | 재시작 3회(+화면용 1회) 모두 9.2.4, 덮어쓰기 0 | 통과 |
| Q4 운영 확인 | — | — | **미실행** — 수정본을 운영에 배포한 뒤 플러그인 관리 화면에서 확인해야 한다 |

### 성공 기준 실측

| SC | 기준 | 실측 | 판정 |
|---|---|---|---|
| SC-001 | 3회 연속 재시작에도 버전 유지, 재배포 0회 | 로컬 격리 서버에서 Boards 9.2.4 3/3 유지(+r4), 재배포 0회. 운영 실측은 Q4 대기 | 로컬 통과 |
| SC-002 | 재시작 뒤 보드·플레이북·에이전트 화면이 열린다 | 보드 화면 확인(`evidence/boards-after-restart.png`). 플레이북·에이전트 포크 번들이 로컬에 없어 화면 미확인 | 부분 통과(보드만) |
| SC-003 | 운영 이미지에 세 공식판 0개, 나머지 개수·이름 동일(12.1.0 기준 12개) | 0개, 나머지 24개 파일 = 12개 플러그인, 이름 동일 | 통과 |
| SC-004 | ledger "반영 예정" 0개 | 0개(14건 모두 제외 절) | 통과 |
| SC-005 | make 목록 세 공식판 0개, 일반 10개, FIPS 빈 값 | 일반 10, FIPS 0 | 통과 |

