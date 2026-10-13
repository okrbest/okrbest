# OKRBEST O'talk 리브랜딩 작업 절차

이 문서는 okrbest(Mattermost 포크)를 **OKRBEST O'talk** 브랜드로 바꾸는 작업의
전체 지도다. 실행 단계로 들어갈 때는 이 문서를 입력 삼아 `/speckit-specify`로
spec을 만들고, spec-kit 파이프라인(plan → tasks → implement)을 따른다.

## 표기 규칙

| 항목 | 값 |
|---|---|
| 정식 명칭 | OKRBEST O'talk |
| 짧은 표기 (UI 타이틀, 탭 제목) | O'talk |
| `SiteName` 설정값 | `OKRBEST O'talk` (14자 — `SitenameMaxLength` 30자 제한 통과) |
| 도메인 | okrbest.com (docs.okrbest.com은 이미 코드에 반영됨) |

어포스트로피(`'`)가 들어가므로 JSON 문자열·Go 문자열에서는 문제없지만,
셸 스크립트·SQL 시드·단일 인용 YAML에 넣을 때는 이스케이프를 확인한다.

## 전략 — upstream sync와 충돌을 최소화한다

이 저장소는 upstream(mattermost/mattermost) 커밋을 `/speckit-sync`로 계속
선별 반영한다. 리브랜딩 변경은 전부 upstream과의 영구 분기가 되므로,
**충돌 표면적이 작은 쪽부터** 바꾼다.

1. **설정값** (config.json) — 코드 변경 없음. 충돌 위험 0. 가장 먼저 한다.
2. **코드 기본값 + 정적 자산** — 변경 지점이 적고 upstream 변동도 드물다.
3. **i18n 문자열** — upstream이 자주 갈아엎는 파일이라 sync마다 충돌 비용을
   낸다. 꼭 필요한 문자열만 선별해서 바꾼다.

코드를 고칠 때는 기존 관례대로 `// okrbest:` 주석 마커를 남기고, 후속 sync에서
충돌·오해를 부를 분기는 [docs/upstream-adapted-divergences.md](docs/upstream-adapted-divergences.md)에 등록한다.

## 현재 상태

이미 된 것:

- 문서 링크 전면 치환 — [constants.tsx](webapp/channels/src/utils/constants.tsx)의
  `DocLinks`가 docs.okrbest.com을 가리킨다.
- `okrbest:` 분기 마커 관례와 분기 ledger가 자리 잡았다.

아직 Mattermost로 남은 것:

- 제품명 기본값: [config.go:144](server/public/model/config.go#L144)
  `TeamSettingsDefaultSiteName = "Mattermost"`
- 브라우저 탭: [root.html:10](webapp/channels/src/root.html#L10) `<title>Mattermost</title>`,
  13행 `application-name`
- 로고·파비콘 자산 일체, About 모달, i18n 문자열, 지원 링크 기본값

## 0단계 — 브랜드 자산을 준비한다

디자인 산출물이 없으면 1단계 이후가 전부 막힌다. 교체 대상 파일 목록
(모두 [webapp/channels/src/images/](webapp/channels/src/images/)):

| 용도 | 파일 |
|---|---|
| 앱 로고 | `logo.svg`, `logo.png`, `logoWhite.png` |
| 이메일 로고 | `logo_email_blue.png`, `logo_email_dark.png`, `logo_email_gray.png`, `logo-email.png` |
| 파비콘 세트 | `favicon/` 아래 android-chrome·apple-touch-icon 전체 (각 해상도별) |

추가로 코드에 SVG로 박힌 로고가 있다 — `components/widgets/icons/mattermost_logo.tsx`
(About 모달 등에서 사용). O'talk SVG 컴포넌트로 교체하거나 내용을 바꾼다.

## 1단계 — 설정값만으로 바꿀 수 있는 것을 먼저 바꾼다

코드 수정 없이 운영 config.json(또는 `MM_*` 환경변수)으로 적용한다.
배포 저장소(okrbest-deploy)의 설정과 한 쌍으로 맞춘다.

| 설정 | 내용 |
|---|---|
| `TeamSettings.SiteName` | `OKRBEST O'talk` — 로그인 화면, 데스크톱 앱 창 제목, 푸시·이메일 알림 제목까지 이 값을 따라간다 |
| `SupportSettings.*` | 이용약관·개인정보·소개·도움말·문제신고 링크 5종 + `SupportEmail` → okrbest.com으로 |
| `NativeAppSettings.AppDownloadLink` 등 | 앱 다운로드 링크 3종 |
| `EmailSettings.FeedbackName/FeedbackEmail/FeedbackOrganization` | 메일 발신자 표시 |
| `LogSettings`, `ServiceSettings.EnableDiagnostics`, `EnableSentry` | 텔레메트리가 Mattermost(RudderStack)·Sentry로 나간다. 리브랜딩 시점에 끌지 결정한다 |

이 단계만 끝나도 사용자 눈에 보이는 브랜드의 대부분이 바뀐다.

## 2단계 — 코드 기본값과 정적 자산을 바꾼다

설정이 비어 있을 때의 폴백까지 O'talk이 되도록 기본값을 바꾼다.
전부 `// okrbest:` 마커를 남긴다.

- [config.go](server/public/model/config.go):
  `TeamSettingsDefaultSiteName`(144행), `SupportSettingsDefault*Link` 5종(174–178행),
  `NativeappSettingsDefault*`(221행~), `MmSupportAdvisorAddress`(77행).
  `GenericNotificationServer`(76행, push-test.mattermost.com)는 푸시 인프라
  결정(5단계)과 함께 바꾼다.
- [root.html](webapp/channels/src/root.html): `<title>`, `application-name` 메타.
- 0단계에서 준비한 이미지 자산 교체. 파일명은 유지한다 — 파일명을 바꾸면
  import 경로 diff가 upstream 충돌을 만든다.
- [about_build_modal.tsx](webapp/channels/src/components/about_build_modal/about_build_modal.tsx):
  로고·"Learn more about Mattermost" 문구. 단, 라이선스 고지 부분은 지우지 않는다(6단계).

## 3단계 — i18n 문자열을 선별해서 바꾼다

실측 (2026-10-13, `grep -c "Mattermost"`):

| 파일 | 건수 | 방침 |
|---|---|---|
| `webapp/channels/src/i18n/ko.json` | 23 | **우선 작업.** 주 사용 언어라 효과가 즉시 보이고 양도 적다 |
| `server/i18n/ko.json` | 4 | 같이 처리 |
| `webapp/channels/src/i18n/en.json` | 211 | 선별 — 사용자 노출 문자열만 |
| `server/i18n/en.json` | 57 | 선별 — 알림·이메일 관련만 |

선별 기준: **제품명으로서의 Mattermost**(예: "Welcome to Mattermost")만 바꾼다.
기술 참조(플러그인 ID, mattermost.com 링크 중 upstream 기능 문서, 라이선스 문구,
마이그레이션 안내)는 남기거나 별도 판단한다. 가능한 문자열은 치환 대신
`{siteName}` 변수를 쓰는 쪽으로 바꾸면 이후 sync 충돌이 줄어든다.

주의: i18n 파일은 upstream이 릴리스마다 통째로 갱신한다. 여기서 바꾼 키는
`/speckit-sync` 때마다 충돌 후보가 되므로, 바꾼 키 목록을 분기 ledger에 올린다.

## 4단계 — 이메일·알림을 바꾼다

- [server/templates/](server/templates/)의 이메일 템플릿은 대부분 `{{.SiteName}}`
  변수를 써서 1단계 설정만으로 해결된다. 하드코딩은 실측 기준 1개 파일뿐이다
  (`grep -rl "Mattermost" server/templates/`로 재확인 후 수정).
- 이메일 로고는 0단계 `logo_email_*` 자산 교체로 해결된다.
- 푸시 알림 제목은 `SiteName`을 따라간다. 푸시 프록시 주소
  (`GenericNotificationServer`)와 모바일 앱 이름은 5단계 소관.
  운영 가이드는 [docs/mattermost-mobile-push-proxy-guide.md](docs/mattermost-mobile-push-proxy-guide.md) 참조.

## 5단계 — 배포와 외부 접점을 맞춘다

- **배포 저장소 결합**: okrbest-deploy 워크플로우와 이 저장소의 Dockerfile
  레이아웃이 결합돼 있다. 이미지 이름·라벨을 바꾸면 deploy 쪽 워크플로우를
  한 쌍으로 수정한다 (develop 반영 시 dev 워크플로우 cp 포함).
- Docker 이미지 이름·`org.opencontainers` 라벨: [server/build/Dockerfile](server/build/Dockerfile),
  [.github/workflows/docker-push-mirrored.yml](.github/workflows/docker-push-mirrored.yml).
- **모바일·데스크톱 앱은 별도 저장소다.** 서버 리브랜딩으로는 앱 안의 표시
  이름(SiteName 연동 부분)만 바뀐다. 앱 아이콘·스토어 명칭·번들 ID는 각 앱
  포크에서 따로 진행한다. 범위 밖임을 spec에 명시한다.

## 6단계 — 법적 사항을 확인한다

- **상표**: Mattermost 이름·로고는 Mattermost, Inc.의 상표다. 수정본을 배포할
  때 혼동을 주는 사용은 상표 정책 위반이므로, 사용자 노출 지점에서 로고·이름을
  걷어내는 이 작업은 의무에 가깝다.
- **라이선스 고지 유지**: `LICENSE.txt`, `NOTICE.txt`, 소스 파일의
  `Copyright (c) 2015-present Mattermost, Inc.` 헤더는 지우거나 바꾸지 않는다.
  About 모달의 라이선스 고지도 유지한다.
- 이용약관·개인정보처리방침은 mattermost.com 문서를 링크만 바꾸면 끝나는 게
  아니다 — okrbest.com에 실제 문서를 준비해야 1단계 링크 교체가 의미를 가진다.

## 검증 — 증거 없이는 완료가 아니다

구현 spec의 SC(성공 기준)는 아래를 실측으로 확인한다 (constitution 원칙 I·III).

```bash
# 잔존 브랜딩 스캔 (사용자 노출 표면)
grep -rn "Mattermost" webapp/channels/src/root.html webapp/channels/src/i18n/ko.json server/i18n/ko.json
grep -rl "Mattermost" server/templates/
```

수동 확인 체크리스트:

- [ ] 브라우저 탭 제목과 파비콘이 O'talk으로 보인다
- [ ] 로그인 화면·회원가입 화면에 Mattermost 로고·문구가 없다
- [ ] 메인 메뉴 → 정보(About) 모달: O'talk 로고 + 라이선스 고지 유지
- [ ] 이메일 발송 실측 (dev는 inbucket http://localhost:9001): 발신자명·로고·본문 제품명
- [ ] 푸시 알림 제목 (모바일 연동 환경에서)
- [ ] 시스템 콘솔에서 "Mattermost" 검색 — 남은 문자열이 선별 기준(3단계) 안에 있는지
- [ ] `/speckit-sync` 1회 시험 수행 — 리브랜딩 분기로 생기는 충돌이 ledger에 기록한 범위 안인지

## 다음 행동

1. 0단계 브랜드 자산 준비 상태 확인 (디자인 소스 유무).
2. `/speckit-specify`로 이 문서를 입력 삼아 리브랜딩 spec 생성 —
   단계 1~2를 1차 범위로, 3~5는 후속 spec으로 나누는 것을 권장.
3. 분기 ledger 등록 규칙을 spec의 FR에 포함.
