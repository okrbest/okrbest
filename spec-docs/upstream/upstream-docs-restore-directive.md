# 작업 지시: upstream `docs/` 문서 트리 계보를 master에 반영한다

작성일 2026-11-09 (2차 개정). 기준 커밋: master `9aa6b4e280`, upstream-master `ea90a1c2d5`.
장부: `spec-docs/upstream/upstream-master-unmerged-commits.md`.

## 0. 처리 원칙

**Mattermost 조직에 귀속된 저장소·설정값은 제외 사유가 아니다.** 그런 항목을 만나면
우리 조직(okrbest) 저장소와 설정값으로 바꿔서 받는다. 바꿀 값이 아직 없으면(예: Algolia
인덱스, 배포 버킷) 파일과 워크플로는 받되 값은 저장소 변수(`vars.*`)·시크릿(`secrets.*`)으로
비워 두고 §5 표의 "확보 필요" 항목으로 넘긴다. "Mattermost 인프라라서 뺀다"는 판정은
이 작업에서 쓰지 않는다.

치환은 설정과 저장소 참조에 한정한다. 문서 본문(docs/main·docs/develop의 mdx)은 D1 결정에
따르며, 이 지시의 기본값(미러)에서는 본문을 고치지 않는다.

## 1. 배경과 현재 상태

upstream(mattermost/mattermost)은 2026-07-02 커밋 `1d3bbc63`(#37330)으로 제품 문서 사이트
전체를 모노레포 `docs/`에 넣었다. 포크는 이 커밋을 constitution 원칙 IV(리브랜드 충실성)
근거로 제외했고, 이후 `docs/`를 건드린 커밋을 모두 "문서 사이트 계보"로 묶어 제외해 왔다.
2026-11-09 PR #594로 포크 자체 문서를 `spec-docs/`로 옮겨 현재 master에는 `docs/`
디렉터리가 없다. 경로가 겹치지 않으므로 upstream 문서 트리를 그대로 받을 수 있다.

우리 조직에는 이미 `okrbest/okrbest-docs`(Sphinx 기반, mattermost/docs의 포크, 마지막 푸시
2026-06-15)가 있다. upstream이 mattermost/docs를 모노레포 Docusaurus로 이관한 것과 같은
관계이므로, 이 작업은 okrbest-docs를 모노레포 `docs/`로 이관하는 일이기도 하다. 레거시
Sphinx URL 리다이렉트 생성기(`gen-active-redirects.mjs`)가 그 전환을 돕는다.

반영 대상은 upstream-master에서 `docs/`를 건드렸으나 master에 없는 커밋 165개다.

| 그룹 | 수 | 정의 | 처리 |
|---|---|---|---|
| A | 104 | `docs/`만 바꾼 커밋. 장부 "제외된 커밋" 부록에 문서 사이트 계보 사유로 기재 | `git cherry-pick -x` 통째 반영 |
| B | 16 | `docs/`와 다른 파일을 함께 바꾼 커밋. 미반영 | §6 표대로 처리. 문서 인프라 파일은 치환해서 받고, 다른 계보로 제외된 코드만 `docs/` 부분 분리 |
| C | 45 | 이미 picked/adapted로 반영했으나 당시 `docs/` 부분을 버린 커밋 | `docs/` 부분만 추가 반영 |

B 16개 중 12개는 문서 사이트 계보 사유로, 4개는 다른 사유(property v2 계보 `85b7d85b`·
`fbc17416`, compass-ui 계보 `e3d074ff`, Agents 번들 버전 `751b8cb6`)로 제외된 것이다.
C의 `docs/` 부분은 95개 파일이며 버린 사실이 `upstream-adapted-divergences.md`에 커밋별로
기록돼 있다.

규모: `docs/` 1,642개 파일, 약 19만 9천 줄. 구성은 `docs/site`(Docusaurus 사이트·테마·
에셋) 904, `docs/main`(관리자·사용자 문서) 426, `docs/develop`(기여자 문서) 302, 그 외
`styles`(Vale 규칙)·`scripts`·`api`·`vendor`.

## 2. 시작 전에 확정할 결정

사용자가 결정한다. 결정 없이 반영을 시작하지 않는다. 권장안을 함께 적는다.

**D1. 본문 반영 모델.**
- (권장) **upstream 미러**: `docs/main`·`docs/develop` 본문을 고치지 않는다. 포크에 없는
  기능의 문서도 들어온다. 이후 sync에서 `docs/` 커밋은 cherry-pick으로 처리할 수 있다.
  사이트 설정·브랜드·인프라는 §5대로 우리 값으로 바꾼다. 본문 안의
  `docs.mattermost.com` 절대 링크 2,034개는 이 모델에서 그대로 남는다. 상대 링크로 바꾸는
  일은 §9의 후속 과제다.
- **선별·리브랜드**: 포크에 있는 기능만 남기고 OKR.BEST 기준으로 본문을 고친다. 19만 줄을
  다시 쓰는 일이고 이후 모든 docs 커밋이 adapt가 된다. 이 모델을 고르면 이 지시 대신
  brainstorming부터 시작하는 별도 과제로 전환한다.

**D2. 원칙 IV 재판정.** 미러 모델에서 본문의 "Mattermost"는 upstream 출처를 가리키는
이름이지 포크 제품명이 아니다. 이 해석을 `spec-docs/rebrand.md` 상표 절에 한 줄로 명시하고,
장부 `1d3bbc63` 행의 제외 사유를 철회하는 근거로 삼는다. 사이트 제목·로고·푸터처럼
"우리 사이트"로 보이는 자리는 §5대로 OKR.BEST로 바꾼다.

**D3. 운영할 인프라 범위.** 워크플로 파일은 전부 받는다(§0). 다만 실제로 동작시키려면
아래 값이 필요하다. 어디까지 지금 확보할지 정한다. 확보하지 못한 값은 변수로 비워 두고
해당 워크플로는 값이 들어올 때까지 실패하거나 건너뛴다(§5 표의 "확보 필요" 열).
- 문서 사이트 배포: AWS S3 버킷·CloudFront 배포·IAM 자격
- PR 미리보기: 미리보기용 S3 버킷·자격
- 검색: Algolia 애플리케이션·인덱스 (없으면 검색 없이 빌드된다. 설정이 이미 env 분기다)
- AI 문서 봇(리뷰·작성·갭 분석): `ANTHROPIC_API_KEY`(포크 워크플로에 이미 있음), GitHub App
  비밀키, 모델명 변수

**D4. Agents 문서 서브모듈.** upstream은 `mattermost/mattermost-plugin-agents`의 `docs/`를
서브모듈로 끌어와 스테이징한다. 우리는 `okrbest/okrbest-plugin-agents`(`docs/` 디렉터리
존재 확인됨)로 바꾼다. 서브모듈 방식을 유지할지, 빌드 시 clone하는 방식으로 바꿀지 정한다.
권장: 서브모듈 유지(upstream 스크립트를 그대로 쓸 수 있다).

## 3. 사전 조건

- 작업 브랜치에서 시작한다(원칙 VI). `master` 위에서 편집하지 않는다.
  ```bash
  git fetch origin master upstream-master
  git checkout -b sync/upstream-docs-tree origin/master
  ```
- `docs/` 디렉터리가 없는지 확인한다. `docs/superpowers/`가 남아 있으면 브레인스토밍
  임시 폴더이므로 그대로 둔다(`.gitignore` 197행).
- 반영 순서는 upstream 시간순(오래된 것 먼저)으로 고정한다. 문서 커밋은 서로 쌓이므로
  순서를 바꾸면 충돌이 난다.

대상 목록과 분류를 작업 시점에 다시 만든다. 이 지시의 숫자는 2026-11-09 기준이다.

```bash
S=/tmp/docs-restore && mkdir -p $S
git log --reverse --format='%H %s' --no-merges upstream-master ^master -- docs/ > $S/all.txt
: > $S/A.txt; : > $S/B.txt; : > $S/C.txt
while read -r h subj; do
  if [ -n "$(git log master --format=%h --grep="$h")" ]; then echo "$h $subj" >> $S/C.txt; continue; fi
  if git diff-tree --no-commit-id --name-only -r "$h" | grep -qv '^docs/'; then echo "$h $subj" >> $S/B.txt
  else echo "$h $subj" >> $S/A.txt; fi
done < $S/all.txt
wc -l $S/A.txt $S/B.txt $S/C.txt
```

`$S/all.txt`가 반영 순서다. 각 커밋을 만날 때 어느 그룹인지 보고 §4의 해당 절차를 적용한다.

## 4. 반영 절차

### 4.1 루트 커밋 `1d3bbc63` (B 그룹, 첫 번째)

`docs/` 1,410개 파일과 `.gitignore`·`.editorconfig`를 바꾼다. merge-tree 드라이런에서
`.gitignore`만 충돌한다.

```bash
git cherry-pick -x 1d3bbc638b140e19541cdc4acb73d5dafa22c6ac
# .gitignore 충돌: 우리 내용을 유지하고 upstream이 추가한 7줄을 끝에 덧붙인다
#   # Docusaurus docs site (docs/)
#   docs/site/build/  docs/site/.docusaurus/  docs/site/node_modules/
#   docs/api/reference/  docs/pdf/build/  docs/pdf/node_modules/
git add .gitignore && git cherry-pick --continue
```

cherry-pick 직후, 같은 브랜치에서 **치환 커밋**을 하나 더 만든다. §5 표의 "사이트 설정"과
"브랜드 자산" 항목을 적용한 커밋이다. 제목은 `docs(site): Mattermost 귀속 설정을 okrbest
값으로 치환`, 본문에 바꾼 키와 값을 표로 적는다. 이 커밋에는 upstream 참조 트레일러를
붙이지 않는다(upstream 커밋이 아니다).

이후 A 그룹 커밋이 `docusaurus.config.ts` 등 치환한 파일을 수정하면 충돌이 날 수 있다.
그때는 upstream 변경 의도를 받되 우리 값을 유지한다. 충돌 해소 내용을 커밋 본문에 적는다.

### 4.2 A 그룹: `docs/` 전용 커밋

```bash
git cherry-pick -x <hash>
```

충돌이 나면 두 경우를 구분한다. (1) 치환한 설정 파일에서 난 충돌은 §4.1 마지막 단락대로
처리한다. (2) 그 밖의 `docs/` 파일 충돌은 순서 오류나 앞선 커밋 누락의 신호다. 원인을 찾은
뒤 진행한다.

### 4.3 B 그룹

§6 표의 판정에 따라 둘 중 하나로 처리한다.

**(가) 전체를 받되 치환**: 문서 인프라 파일(워크플로·`.gitmodules`·`.github/prompts`·
`.github/scripts/docs-ai`)을 포함한 커밋. `git cherry-pick -x`로 전체를 받은 뒤, 같은 커밋을
`--amend`하거나 바로 뒤에 치환 커밋을 두어 §5 표의 값으로 바꾼다. 트레일러는 일반 규칙대로
`Upstream:`이 붙는다(adapt 반영). 바꾼 내용은 §7에서 divergences에 기록한다.

**(나) `docs/` 부분만**: 코드 부분이 다른 계보(property v2·compass-ui 등)로 제외된 커밋.

```bash
git diff <hash>^ <hash> -- docs/ | git apply --index --3way
git commit -F - <<EOF
docs: <upstream 제목> — docs/ 부분만 반영

<docs/ 외 파일을 어떻게 했는지 한 줄. §6 표 참조>

Upstream-docs: https://github.com/mattermost/mattermost/commit/<full-hash>
EOF
```

**(나)에서 트레일러를 `Upstream:`으로 쓰지 않는다.** `upstream-sync.sh`는 `Upstream: <URL>`
형식과 `cherry picked from commit <hash>` 형식을 "커밋 전체 반영"으로 집계한다(스크립트
37~40행). `docs/`만 받은 커밋에 그 형식을 쓰면 장부가 코드 부분까지 반영된 것으로 오판해
제외 목록에서 지워 버린다. `Upstream-docs:`는 그 정규식에 걸리지 않는다.

### 4.4 C 그룹: 이미 반영한 커밋의 `docs/` 부분

```bash
git diff <hash>^ <hash> -- docs/ | git apply --index --3way
git commit -F - <<EOF
docs: <upstream 제목> — 반영 당시 버린 docs/ 부분 복원

포크 반영 커밋: <우리 커밋 해시>.

Upstream-docs: https://github.com/mattermost/mattermost/commit/<full-hash>
EOF
```

C 커밋은 이미 `Upstream:` 트레일러로 집계돼 있으므로 여기서도 `Upstream-docs:`를 쓴다.

## 5. Mattermost 귀속 설정·저장소 치환표

값이 정해진 것은 그대로 적용한다. "확보 필요"는 D3에서 정한 범위에 따라 사용자가 값을
만들어 저장소 변수·시크릿에 넣는다. 값을 넣기 전까지는 키 이름만 맞춰 둔다.

### 5.1 사이트 설정 `docs/site/docusaurus.config.ts`

| 행 | upstream 값 | okrbest 값 |
|---|---|---|
| 42 `title` | `'Mattermost Documentation'` | `'OKR.BEST Documentation'` |
| 43 `tagline` | `'Mission in Motion'` | REBRAND.md의 제품 슬로건. 없으면 빈 문자열 |
| 44 `favicon` | `'img/brand/icon-denim.svg'` | 경로 유지, 파일을 §5.2대로 교체 |
| 50 `url` | `'https://docs.mattermost.com'` | `'https://docs.okrbest.com'` (webapp `DocLinks`가 이미 이 도메인을 쓴다) |
| 54 `organizationName` | `'mattermost'` | `'okrbest'` |
| 55 `projectName` | `'mattermost'` | `'okrbest'` |
| 91·109·119 `editUrl` | `https://github.com/mattermost/mattermost/tree/master/docs/...` | `https://github.com/okrbest/okrbest/tree/master/docs/...` |
| 27 `indexName` | `'mattermost-docs'` | `'okrbest-docs'`. 확보 필요: Algolia 앱·인덱스. 없으면 env 미설정으로 검색 섹션이 빠진다(기존 분기) |
| 194·227 GitHub `href` | `https://github.com/mattermost/mattermost` | `https://github.com/okrbest/okrbest` |
| 228 Forum `href` | `https://forum.mattermost.com/` | 우리 커뮤니티 채널 URL. 없으면 항목 삭제 |
| 232 `copyright` | `Copyright © <year> Mattermost, Inc. All rights reserved.` | `Copyright © <year> OKR.BEST. Documentation derived from Mattermost documentation © Mattermost, Inc.` — 출처 표시는 유지한다(rebrand.md "Based on Mattermost" 권고, 원칙 IV) |

`docs/site/src` 아래 15개 컴포넌트(`TryMattermost`, `EditionAvailability`, `PlanAvailability`,
`DeploymentArchitectureBuilder`, `SecurityUpdates/feed.ts` 등)에도 브랜드·URL이 박혀 있다.
`git grep -il mattermost docs/site/src`로 목록을 뽑아 하나씩 본다. 외부 URL(요금제·보안
공지 피드·체험 신청)은 우리 URL이 있으면 바꾸고, 없으면 컴포넌트를 그대로 두고 §7의
divergences에 "미치환, URL 확보 시 교체"로 적는다. 본문 mdx가 그 컴포넌트를 쓰므로
삭제하지 않는다.

### 5.2 브랜드 자산 `docs/site/static/img/brand/`

| 파일 | 교체 자산 |
|---|---|
| `icon-denim.svg` `icon-white.svg` | REBRAND.md 파비콘 세트의 SVG 아이콘(없으면 `logo.svg`에서 아이콘 추출) |
| `logo-horizontal-denim.svg` `logo-horizontal-white.svg` | REBRAND.md 앱 로고 `logo.svg`(가로형)·흰색 변형 |

파일명은 유지해 config와 컴포넌트의 경로 참조를 건드리지 않는다. 테마 색(denim)은
`docs/site/src/css`에서 OKR.BEST 팔레트로 바꾼다. 팔레트는 `webapp/channels/src/sass/okrbest/`
의 변수를 기준으로 한다.

### 5.3 서브모듈 `.gitmodules` (`5fbb2a32`)

| upstream | okrbest |
|---|---|
| `url = https://github.com/mattermost/mattermost-plugin-agents.git` | `url = https://github.com/okrbest/okrbest-plugin-agents.git` |
| `path = docs/vendor/mattermost-plugin-agents` | 경로 유지. `stage-agents-docs.mjs`가 이 경로를 참조한다. 바꾸려면 스크립트 주석·상수도 함께 바꾼다 |

`git submodule add`로 등록한 뒤 `npm run stage:agents-docs`가 `okrbest-plugin-agents/docs/`
(admin_guide.md·aws_bedrock_setup.md·features·img·load-testing.md)를 스테이징하는지
확인한다. upstream 스크립트가 기대하는 파일명이 우리 플러그인 저장소와 다르면 스크립트를
맞추고 divergences에 적는다.

### 5.4 배포 `.github/workflows/docs-cd.yml` (`dd69d06d`·`5fbb2a32`)

| 키 | 의미 | okrbest 처리 |
|---|---|---|
| `vars.DOCS_DEPLOY_ROLE_ARN` | OIDC로 assume할 IAM 역할 | 확보 필요. 포크 워크플로 9개는 OIDC 대신 `secrets.AWS_ACCESS_KEY_ID`·`AWS_SECRET_ACCESS_KEY`를 쓴다. 역할을 만들지 않으려면 `configure-aws-credentials` 단계를 포크 관례(액세스 키)로 바꾼다 |
| `vars.DOCS_BUCKET_NAME` | 사이트 S3 버킷 | 확보 필요. docs.okrbest.com을 가리킬 버킷 |
| `vars.DOCS_CF_DISTRIBUTION_ID` | CloudFront 배포 | 확보 필요 |
| `aws-region: us-east-1` | 리전 | 우리 인프라 리전으로 |

트리거는 `push: master, paths: docs/**, api/v4/source/**, api/playbooks/**`다. 값이 비어 있으면
첫 push에서 실패한다. D3에서 배포를 아직 안 하기로 했으면 `workflow_dispatch`만 남기고
`push` 트리거를 주석 처리한 뒤 divergences에 적는다. 파일은 삭제하지 않는다.

### 5.5 PR 미리보기 `docs-preview*.yml` (`33eb5b1a`)

| 키 | okrbest 처리 |
|---|---|
| `secrets.AWS_DOCS_PR_PREVIEW_KEY_ID` `AWS_DOCS_PR_PREVIEW_SECRET_ACCESS_KEY` | 확보 필요. 미리보기 버킷 전용 자격 |
| 버킷 접두어 `mattermost/pr-<N>/` (template 110행) | `okrbest/pr-<N>/` |
| 주석의 `mattermost/docs` 공유 버킷 설명 (94~98행) | `okrbest/okrbest-docs`로 바꾸거나 주석 삭제 |
| `docs-preview-fork.yml` | 포크 PR용. 우리 저장소도 외부 PR을 받을 수 있으므로 유지 |

### 5.6 CI `docs-ci.yaml` (`dd69d06d`·`c57df45d`·`5fbb2a32`)

| 항목 | okrbest 처리 |
|---|---|
| `vars.ALGOLIA_APP_ID` `ALGOLIA_SEARCH_API_KEY` | 확보 필요(선택). 없으면 검색 없이 빌드 |
| egress 허용 목록 `docs/site/scripts/check-egress.mjs` | `docs.mattermost.com`을 `docs.okrbest.com`으로 바꾼다. 미러 모델에서 본문 링크가 `docs.mattermost.com`을 가리키므로 **둘 다** 허용 목록에 둔다. wistia·youtube·Google Fonts는 유지 |
| OpenAPI 빌드 `build-openapi.mjs` | 모노레포 `api/v4/html/static/mattermost-openapi-v4.yaml`을 읽는다. 포크에 `api/v4`·`api/Makefile`(`build` 타깃)이 있으므로 `make -C api build`가 같은 경로를 만드는지 확인. 산출 파일명 `mattermost-openapi-v4.yaml`은 유지 |
| 레거시 리다이렉트 `gen-active-redirects.mjs` | `scripts/migrate-main-docs/redirects.json`은 mattermost/docs의 Sphinx URL 목록이다. okrbest-docs가 같은 포크라 URL 구조가 같으므로 그대로 쓴다. okrbest-docs에서 자체 추가한 페이지가 있으면 그 URL을 redirects.json에 추가한다 |

### 5.7 AI 문서 봇 `docs-review.yml` `docs-writer-merged-pr.yml` `docs-gap.yml` `docs-editor-review-label.yml` (`9fa53220` 외)

| 키 | okrbest 처리 |
|---|---|
| `secrets.ANTHROPIC_API_KEY` | 포크 워크플로에 이미 존재. 그대로 |
| `secrets.DOCS_AI_APP_PRIVATE_KEY` + App ID | 확보 필요. okrbest 조직에 GitHub App을 만들어 등록하거나, `GITHUB_TOKEN`으로 대체 가능한지 워크플로를 읽고 판단 |
| `vars.DOCS_AI_ROUTER_MODEL` `DOCS_AI_REVIEW_MODEL` `DOCS_AI_GAP_MODEL` | `claude-sonnet-5-5` 등 현재 모델 ID로 설정. 기본값 `claude-sonnet-4-6`은 구형 |
| `.github/prompts/docs-writer.md` `.github/scripts/docs-ai/**` | 받는다. 프롬프트 안의 "Mattermost" 제품 지칭·`docs.mattermost.com`·Mattermost 스타일 가이드 참조를 OKR.BEST·`docs.okrbest.com`·우리 constitution 원칙 VIII(문체)로 바꾼다 |
| `anthropics/claude-code-action` 버전 고정 | 유지 |

이 워크플로들은 `pull_request`·`workflow_dispatch` 트리거라 값이 없어도 master push를 깨지
않는다. 값을 넣을 때까지 `workflow_dispatch`만 남길지는 D3에서 정한다.

### 5.8 Vale 스타일 `docs/styles/Mattermost/`

`Terminology.yml`이 'matter most'→'Mattermost' 치환과 Channels·Playbooks·Boards·Copilot
제품명을 강제한다. 미러 모델에서 본문은 Mattermost 문서이므로 규칙 파일은 그대로 받는다.
우리 문서 작성 규칙이 필요해지면 `docs/styles/OKRBEST/`를 추가하고 `.vale.ini`에 등록한다.
기존 스타일을 삭제하거나 이름을 바꾸지 않는다(이후 upstream 커밋과 충돌).

### 5.9 오프라인 문서 동봉 `f434bd9d`

`server/channels/web/docs.go`가 빌드된 사이트를 서버에서 서빙하고 `release.mk`가 tarball에
넣는다. 받으면 `docs/scripts/build-offline-bundle.py`의 기본 URL·제품명을 확인한다.
서버 코드 5파일 +442줄이므로 원칙 I 게이트(`make -C server check-style`, 관련 테스트)를
통과해야 한다.

## 6. B 그룹 처리 판정 (2026-11-09 기준 16건)

| 커밋 | `docs/` 외 파일 | 처리 |
|---|---|---|
| `1d3bbc63` | `.gitignore` `.editorconfig` | (가) 전체. §4.1 |
| `dd69d06d` `c57df45d` | `docs-ci.yaml` `.gitignore` | (가) 전체 + §5.6 치환 |
| `5fbb2a32` | `docs-cd.yml` `docs-ci.yaml` `.gitignore` `.gitmodules` | (가) 전체 + §5.3·§5.4 치환 |
| `33eb5b1a` `d584e926` | `docs-preview*.yml` `docs-ime-render.yml` | (가) 전체 + §5.5 치환. `docs-ime-render.yml`은 `GITHUB_TOKEN`만 쓰므로 치환 없음 |
| `9fa53220` | `.github/prompts/docs-writer.md` `.github/scripts/docs-ai/**` `.gitignore` | (가) 전체 + §5.7 치환 |
| `f434bd9d` | `server/build/release.mk` `server/channels/web/docs.go` `docs_test.go` `static.go` | (가) 전체 + §5.9. 사용자 결정: 오프라인 동봉 기능을 쓸지. 쓰지 않으면 (나) |
| `b2ce71db` | `i18n/glossary/be.json` `server/i18n/be.json` `i18n.go` `webapp/.../be.json` | (나). 포크에는 be 카탈로그가 처음부터 없어 코드 diff가 0줄이고, 삭제 대상 파일이 없어 전체 cherry-pick은 충돌한다 |
| `4527f4c1` | `server/channels/app/import*.go` | (나). 코드는 장부 사유대로 계속 제외 |
| `4255e314` | `webapp/.../channel_settings_modal/**` | (나). 코드는 계속 제외 |
| `85b7d85b` `fbc17416` | property v2 계보 코드·e2e | (나). 계보 유지 |
| `e3d074ff` | compass-ui 계보 e2e | (나). 계보 유지 |
| `751b8cb6` `2ba31db3` | `server/Makefile` 프리패키지 플러그인 버전 | (나). 포크는 자체 플러그인(okrbest-plugin-agents 등)을 프리패키지하므로 upstream 버전 범프는 계속 제외. `docs/vendor` 변경은 §5.3 서브모듈 치환 뒤 우리 플러그인 저장소 기준으로 다시 확인 |

## 7. 장부와 발산 기록 갱신

반영을 마친 뒤 한 커밋으로 묶는다.

1. **제외 부록 정리.** A 104개와 B (가) 커밋의 행을 "제외된 커밋" 부록에서 지운다.
   B (나) 커밋의 행은 남기되 사유 끝에 "(`docs/` 부분은 <날짜>에 반영, 코드 부분만 제외
   유지)"를 덧붙인다.
2. **루트 행 교체.** `1d3bbc63` 행을 지우고, `upstream-adapted-divergences.md`에
   "문서 사이트 계보 복원" 절을 새로 쓴다. 담을 내용: 제외 철회 근거(D1·D2), §5의 치환
   항목 전체를 "upstream 값 → okrbest 값" 표로, 확보하지 못해 비워 둔 변수 목록, 트리거를
   바꾼 워크플로, 서브모듈 URL, (나)로 처리한 커밋 목록.
3. **C 항목 정정.** `upstream-adapted-divergences.md`에서 C 45개 커밋의 "docs/ … 버렸다"
   문구를 "복원함(<커밋>)"으로 바꾼다. `grep -n 'docs/main\|docs/develop\|docs/site'`로
   87곳을 찾아 하나씩 본다.
4. **장부 재생성.** `bash .specify/scripts/bash/upstream-sync.sh update` 뒤 `status`로
   남은 커밋 0, 제외 수가 A 104개와 B (가) 수만큼 줄었는지 확인한다.
5. **speckit-sync 스킬 보강.** `.claude`·`.agents`·`.cursor` 세 벌의 `speckit-sync/SKILL.md`에
   다음을 추가한다. (ㄱ) `docs/` 본문 커밋은 cherry-pick 기본, 본문 수정 금지(미러).
   (ㄴ) 문서 인프라·설정 커밋은 "Mattermost 귀속 값을 okrbest 값으로 치환해 받는다"가
   기본 판정이며 제외 사유가 아니다. 치환 기준은 divergences의 "문서 사이트 계보 복원"
   절 표다. (ㄷ) `Upstream-docs:` 트레일러 용법. 세 벌이 같아야 한다.
6. **rebrand.md.** D2 해석과 §5.1 copyright 문구를 추가한다.

## 8. 검증

증거 없이는 완료가 아니다(원칙 I·III). 아래 결과를 PR 본문에 붙인다.

```bash
# 1) 트리 동일성: 치환한 파일을 빼면 docs/ 가 upstream-master와 같은가
git diff --stat upstream-master -- docs/ \
  ':!docs/site/docusaurus.config.ts' ':!docs/site/static/img/brand' ':!docs/site/src/css' \
  ':!docs/site/scripts/check-egress.mjs' | tail -1          # 기대: 변경 0
git diff --stat upstream-master -- docs/ | tail -1          # 치환 파일만 나와야 한다
# 2) 서브모듈과 스테이징
git submodule update --init docs/vendor/mattermost-plugin-agents
cd docs/site && npm ci && npm run stage:agents-docs && ls main/agents/docs | head
# 3) 사이트 빌드 (docs-ci.yaml의 Typecheck·Build·egress 단계를 로컬에서 재현)
npm run typecheck && npm run test:egress && npm run build && npm run check:egress && cd -
# 4) 빌드 결과에서 Mattermost 귀속 값이 남았는지
grep -rl 'docs.mattermost.com\|github.com/mattermost/mattermost' docs/site/build/index.html docs/site/build/*.js | head
#    기대: 사이트 셸(네비·푸터·메타)에는 없음. 본문 페이지의 링크는 D1 미러 모델에서 남는다
# 5) 포크 게이트 (코드를 받은 커밋이 있을 때)
make -C server check-style 2>&1 | tail -3     # f434bd9d를 (가)로 받았을 때
# 6) 워크플로 문법과 변수 이름
for f in .github/workflows/docs-*.yml .github/workflows/docs-*.yaml; do gh workflow view "$(basename $f)" >/dev/null && echo "ok $f"; done
grep -ohE '(vars|secrets)\.[A-Z_]+' .github/workflows/docs-* | sort -u    # 비어 있는 값 목록을 PR에 적는다
# 7) 장부
bash .specify/scripts/bash/upstream-sync.sh status
bash .specify/scripts/bash/check-workflow-wiring.sh | tail -1
```

빌드 산출물(`docs/site/build`, `.docusaurus`, `docs/api/reference`)은 `.gitignore`에 있어야 하며
커밋되지 않는다. 서브모듈 체크아웃(`docs/vendor/...`)은 gitlink로만 커밋된다.

## 9. PR과 병합

- 커밋 수가 170개 안팎이므로 PR 하나로 올리되 squash하지 않는다. squash하면 `Upstream:`
  참조가 합쳐져 장부 차감이 깨진다. **rebase merge 고정**.
- CODEOWNERS 경로에 `/.github/workflows/channels-ci.yml`이 있다. docs 워크플로는 해당하지
  않는다. `f434bd9d`로 `server/` 코드를 받으면 CODEOWNERS 경로(`authorization.go` 등)에
  해당하는지 다시 확인한다. 해당하면 코드 소유자 리뷰가 필요하고 작성자 본인은 승인할
  수 없다(PR #594 사례).
- PR 본문에 D1~D4 결정, 그룹별 반영 수, §5 치환표, 비워 둔 변수 목록, §8 결과를 적는다.
- 병합 뒤 `git pull --ff-only origin master`로 로컬 master를 맞춘다.

## 10. 후속 과제 (이 지시의 범위 밖)

- 본문 안 `docs.mattermost.com` 절대 링크 2,034개를 사이트 내부 상대 링크로 바꾸는 일.
  미러 모델과 충돌하므로 별도 결정이 필요하다. 바꾸면 이후 모든 본문 커밋이 adapt가 된다.
- `forum.mattermost.com` 링크 132개, `developers.mattermost.com` 22개도 같은 성격이다.
- `okrbest/okrbest-docs`(Sphinx) 저장소의 처리: 모노레포 `docs/`로 이관이 끝나면 README에
  이관 안내를 적고 보관(archive)한다. 거기서 자체 추가한 페이지가 있으면 먼저 `docs/main`으로
  옮긴다.
- 문서 본문을 OKR.BEST 기준으로 고치는 일(선별·리브랜드 모델).
- `docs-impact-review` 계열(`45f54a0e` 외 21건)과 `docs-needed` 자동화(`891b59d4`). 이들은
  Mattermost 조직의 **별도 저장소 mattermost/docs**를 체크아웃하는 워크플로다. §0 원칙대로
  제외가 아니라 치환 대상이지만, 모노레포 `docs/`가 들어오면 별도 저장소를 볼 이유가
  없어 upstream 자신도 `27c501d2`(#38177)에서 §5.7의 `docs-gap.yml`(자체 해소형 갭 탐지)로
  대체하고 워크플로를 지웠다. 따라서 이 계열은
  "upstream이 대체한 구형"으로 장부 사유를 고쳐 적고 반영하지 않는다.
