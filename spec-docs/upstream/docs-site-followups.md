# 문서 사이트 후속 과제

작성일 2026-11-11. upstream `docs/` 계보 복원을 병합한 뒤 남은 일을 모은다. 복원 작업 자체는
PR #605(앞쪽 99개)와 #604(나머지 100개)로 끝났다. 처리 근거와 치환표는
`upstream-adapted-divergences.md`의 "문서 사이트 계보 복원" 절, 결정 배경은
`upstream-docs-restore-directive.md`에 있다.

항목을 끝내면 체크하고 날짜와 PR 번호를 적는다. 모든 항목이 끝나면 이 문서를 지우지 말고
"완료" 표시만 남긴다.

## 현재 상태 (2026-11-11 확인)

- master에 `docs/`가 upstream `587083dd` 기준으로 들어 있다. 로컬 빌드는 성공한다.
- docs 워크플로 11개는 자동 트리거가 꺼져 있다. `workflow_dispatch`로만 돈다.
- 저장소 변수·시크릿 중 `DOCS_*`·`ALGOLIA_*`는 하나도 없다. `ANTHROPIC_API_KEY`만 있다.
- `2: Editor Review` 라벨이 저장소에 없다.
- `docs.okrbest.com`은 140.238.1.48에서 **기존 Sphinx 사이트(okrbest-docs)**를 서빙한다. 제목은
  "Mattermost documentation"이다. 새 Docusaurus 사이트는 아직 어디에도 배포되지 않았다.
- PR #605를 병합할 때 `docs-cd`가 master push로 한 번 돌아 `configure-aws-credentials`에서 실패했다.
  배포는 일어나지 않았다. 지금은 push 트리거가 꺼져 있어 다시 돌지 않는다.

## 1. 워크플로 되살리기

각 파일 `on:` 블록 머리 주석에 필요한 값이 적혀 있다. 값을 넣은 뒤 주석 처리한 트리거를 풀고,
`workflow_dispatch`로 한 번 돌려 성공을 확인한 다음 병합한다.

| 순서 | 워크플로 | 필요한 것 | 비고 |
|---|---|---|---|
| 1 | `docs-ci.yaml` | 없음 | 바로 켤 수 있다. `pull_request`·`push` 둘 다 푼다 |
| 2 | `docs-ime-render.yml` | 없음 | GITHUB_TOKEN만 쓴다 |
| 3 | `docs-editor-review-label.yml` | 라벨 `2: Editor Review` 생성 | 문서 편집 리뷰 절차를 쓸 때만 |
| 4 | `docs-gap.yml` | `vars.DOCS_AI_GAP_MODEL` | 기본값 `claude-sonnet-4-6`은 구형이다. 현재 모델 ID를 넣는다 |
| 5 | `docs-review.yml` | `vars.DOCS_AI_ROUTER_MODEL`·`DOCS_AI_REVIEW_MODEL` | 원래 수동 전용이라 트리거는 그대로다 |
| 6 | `docs-writer-merged-pr.yml` | okrbest 조직 GitHub App(`vars.DOCS_AI_APP_CLIENT_ID`, `secrets.DOCS_AI_APP_PRIVATE_KEY`), `vars.DOCS_AI_WRITER_MODEL` 외 | App 대신 `GITHUB_TOKEN`으로 될지 먼저 읽어 본다 |
| 7 | `docs-preview.yml`·`docs-preview-cleanup.yml`·`docs-preview-fork.yml` | 미리보기 S3 버킷(`vars.DOCS_PREVIEW_BUCKET_NAME`)과 전용 자격(`secrets.AWS_DOCS_PR_PREVIEW_KEY_ID`·`AWS_DOCS_PR_PREVIEW_SECRET_ACCESS_KEY`) | 버킷 정적 웹사이트 호스팅을 켠다. 접두어는 `okrbest/pr-N/` |
| 8 | `docs-cd.yml` | 아래 2절의 결정 | 배포 대상이 정해져야 한다 |

검색이 필요하면 `vars.ALGOLIA_APP_ID`·`ALGOLIA_SEARCH_API_KEY`를 넣는다(docs-ci·docs-cd 공통,
인덱스 이름 `okrbest-docs`). 없으면 검색 없이 빌드된다.

- [ ] docs-ci 트리거 복원
- [ ] docs-ime-render 트리거 복원
- [ ] AI 문서 봇 모델 변수 설정, docs-gap 트리거 복원
- [ ] docs-writer용 GitHub App 결정
- [ ] 미리보기 버킷·자격 확보, preview 트리거 복원
- [ ] Algolia 사용 여부 결정

## 2. 배포 대상을 정한다 (`docs-cd.yml`)

upstream 워크플로는 S3 + CloudFront + OIDC IAM 역할로 배포한다. 그런데 `docs.okrbest.com`은 지금
AWS가 아닌 서버(140.238.1.48)에서 Sphinx 사이트를 서빙한다. 둘 중 하나를 고른다.

- **S3·CloudFront로 옮긴다**: 버킷(`vars.DOCS_BUCKET_NAME`), CloudFront 배포(`vars.DOCS_CF_DISTRIBUTION_ID`),
  IAM 역할(`vars.DOCS_DEPLOY_ROLE_ARN`)을 만든다. 역할 대신 액세스 키를 쓰려면
  `configure-aws-credentials` 단계를 포크 관례(`secrets.AWS_ACCESS_KEY_ID`·`AWS_SECRET_ACCESS_KEY`)로
  바꾼다. 마지막에 DNS를 CloudFront로 돌린다.
- **기존 서버에 배포한다**: `docs-cd.yml`의 S3 동기화·CloudFront 무효화 단계를 서버 업로드(rsync 등)로
  바꾼다. 이 경우 upstream 이후 커밋이 이 파일을 고칠 때마다 adapt가 된다.

전환 시점에는 레거시 Sphinx URL이 깨지지 않는지 본다. `gen-active-redirects.mjs`가 만드는
리다이렉트가 okrbest-docs URL 구조와 같다(2026-11-10 확인).

- [ ] 배포 대상 결정
- [ ] 인프라 확보와 `docs-cd` 트리거 복원
- [ ] `docs.okrbest.com` 전환과 레거시 URL 확인

## 3. okrbest-docs(Sphinx) 저장소를 정리한다

2절의 전환이 끝나면 `okrbest/okrbest-docs` README에 모노레포 `docs/`로 옮겼다고 적고 보관(archive)한다.
자체 추가 페이지가 없어 옮길 내용은 없다(2026-11-10 확인).

- [ ] README 안내, archive

## 4. `docs/`를 리브랜딩한다 (별도 과제)

지금은 보이는 브랜드를 upstream 그대로 미러한다. 대상 목록은 divergences "문서 사이트 계보 복원" 절의
"리브랜딩 과제로 넘긴 것"에 있다. 요약하면 `docusaurus.config.ts`의 title·tagline·favicon·로고 alt·
Forum 링크·copyright, `docs/site/static/img/brand/` SVG 4개와 denim 테마 색, `docs/site/src` 15개 파일,
`docs/styles/Mattermost/` Vale 규칙, `.github/prompts`·`.github/scripts/docs-ai`의 제품명이다.

이 과제는 upstream 파일을 직접 고친다. 시작하면 이후 sync에서 그 파일들은 adapt가 된다. 규모가 커서
brainstorming부터 시작한다(CLAUDE.md 핸드오프 규칙).

- [ ] 착수 여부 결정

## 5. 본문 절대 링크를 어떻게 할지 정한다

본문에 `docs.mattermost.com` 절대 링크 2,034개, `forum.mattermost.com` 132개,
`developers.mattermost.com` 22개가 있다. 미러 모델에서는 그대로 둔다. 상대 링크로 바꾸면 이후 모든
본문 커밋이 adapt가 되므로 따로 결정한다. 지금 빌드는 egress 허용 목록에 `docs.mattermost.com`을 함께
두어 통과한다.

빌드 경고에 나오는 깨진 링크 24개(14페이지)는 upstream 본문 문제다. upstream이 고치면 sync로 들어온다.
지켜보기만 한다.

- [ ] 결정

## 6. 오프라인 문서 동봉(`f434bd9d`) 서버 코드를 되살린다

`docs/` 부분만 받고 서버 코드 5파일은 보류했다(지시문 §5.9). 복원 조건은 둘이다.

1. 4절 리브랜딩이 끝나 고객 설치본 `/_documentation`에 Mattermost 브랜드 문서가 노출되지 않는다.
2. 릴리스 파이프라인(okrbest-deploy)에 문서 빌드와 `DOCS_BUNDLE` 전달을 넣는다.

되살릴 때는 이 커밋과 후속 문서 핸들러 커밋을 함께 본다. ledger에서는 이 커밋이 "제외(복원 조건 명시)"로
남아 있다.

- [ ] 복원 조건 충족 확인 후 반영

## 7. 다음 정기 sync

`587083dd` 이후 upstream 커밋 19개가 ledger에 남아 있다. 그중 `659b9553`(Refresh the NGINX reverse proxy
documentation, #39776)이 `docs/` 커밋이다. speckit-sync 스킬에 더한 규칙대로 처리한다.

- `docs/` 본문 커밋은 cherry-pick이 기본이다.
- 문서 인프라 커밋은 Mattermost 귀속 값을 okrbest 값으로 치환해 받는다.
- 코드와 섞인 커밋에서 `docs/`만 받을 때는 `Upstream-docs:` 트레일러를 쓴다.

sync PR 커밋이 100개를 넘으면 GitHub rebase merge가 막힌다(`rebaseable: false`). 이번에도 그래서 둘로
나눴다. 100개 이하 단위로 나눠 차례로 병합한다.
