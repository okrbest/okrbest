# 조사: 서버 배포물에서 포크 플러그인의 공식판을 뺀다

**작성일**: 2026-11-18 · **기능**: [spec.md](spec.md)

## R1. 서버는 언제 포크를 공식판으로 바꾸나?

**결정**: 서버 시작 경로는 고치지 않는다. 배포물에서 공식판 파일을 없앤다.

**근거**:

- `server/channels/app/plugin.go:223-233`: 시작할 때 `syncPlugins` →
  `processPrepackagedPlugins` → `persistTransitionallyPrepackagedPlugins` 순서로 돈다.
- `syncPlugins`(`plugin.go:282`)는 로컬 플러그인을 모두 지우고 파일 저장소의 번들을
  `installPluginLocallyAlways`로 다시 설치한다. 우리 포크는 `make deploy`(API 업로드)로
  파일 저장소에 있으므로 이 단계에서 복원된다.
- `processPrepackagedPlugin`(`plugin.go:1014`)은 설정이 켜져 있고(`AutomaticPrepackagedPlugins`)
  플러그인이 활성 상태이면 `installPluginLocallyOnlyIfNewOrUpgrade`로 설치한다.
  `plugin_install.go:491-511`은 번들 버전이 설치된 버전보다 높을 때만 기존 설치를 지우고
  덮어쓴다.
- 버전 비교는 Masterminds semver v3 `Compare`다. 빌드 메타데이터(`+해시`)를 무시한다.
- `focalboard`는 `transitionallyPrepackagedPlugins`(`plugin.go:1061`)에 있다.
  `shouldPersistTransitionallyPrepackagedPlugin`이 파일 저장소의 포크보다 높으면 공식판을
  파일 저장소에도 쓴다. 이 경로는 `AutomaticPrepackagedPlugins`를 보지 않는다.

**검토한 대안**:

- `AutomaticPrepackagedPlugins=false`: 로컬 덮어쓰기는 막지만 Boards의 파일 저장소 교체는
  못 막는다. 운영 설정에 의존해 깨지기 쉽다.
- 설치 로직에서 포크 ID를 건너뛰게 수정: upstream 코드라 sync 충돌이 늘어난다. 기각.

## R2. 운영 이미지의 공식판은 어디서 오나?

**결정**: `server/build/Dockerfile` builder 단계에서 tarball을 푼 뒤 세 플러그인 파일을 지운다.

**근거**:

- 운영 배포는 `okrbest/okrbest-deploy`의 `okrbest-prd-deploy.yml`이다(dev·starter도 같은
  Dockerfile). 이 워크플로는 `make build-client`·`make build-linux-amd64`만 돌린다.
  `make package`·`prepackaged-plugins`는 부르지 않는다.
- Dockerfile은 `MM_PACKAGE`(기본값 `https://latest.mattermost.com/mattermost-enterprise-linux`)를
  받아 `/mattermost`에 푼다(14·34행). 그 뒤 `bin/mattermost`, `bin/mmctl`, `client/*`만
  지운다(42-44행). `prepackaged_plugins/`는 남는다. 워크플로는 `MM_PACKAGE`를 넘기지 않는다.
- 2026-11-18 최신 tarball은 12.1.0이다. `prepackaged_plugins/`에 15개 플러그인(파일 30개)이 있다.
  대상 파일 이름은 다음과 같다.
  - `mattermost-plugin-playbooks-v2.12.1-linux-amd64.tar.gz(.sig)`
  - `mattermost-plugin-boards-v10.1.0-linux-amd64.tar.gz(.sig)`
  - `mattermost-plugin-agents-v2.9.0-linux-amd64.tar.gz(.sig)`
- 빌드 캐시 때문에 tarball 레이어는 `refresh_base`를 켤 때만 새로 받는다. 삭제 단계를
  tarball 레이어 뒤의 별도 `RUN`으로 두면 Dockerfile이 바뀐 시점에 그 단계부터 다시 실행된다.
  `/mattermost` 레이어 digest가 한 번 바뀌어 다음 배포 push가 한 번 커진다.
- `prepackaged_plugins/`는 이미지 `VOLUME` 목록에 없다. 이미지를 바꾸면 운영 컨테이너에도
  그대로 반영된다.

**지울 대상을 고르는 방법**: 버전과 아키텍처가 tarball마다 바뀌므로 패키지 이름 접두어로
고른다(`mattermost-plugin-{playbooks,boards,agents}-v*`). 확장자는 `.tar.gz`와 `.sig`
모두다. Dockerfile의 `SHELL`이 bash라 중괄호 확장을 쓸 수 있다.

**위험과 대응**: upstream이 패키지 이름을 바꾸면(예: Agents의 옛 이름
`mattermost-plugin-ai`) 접두어가 어긋나 조용히 지나칠 수 있다. 같은 `RUN` 끝에서 세
접두어 파일이 남아 있으면 빌드를 실패시킨다. 이름이 완전히 바뀐 경우는 이 검사로 못 잡는다.
quickstart의 이미지 목록 확인(Q1)이 그 경우를 보완한다.

**검토한 대안**:

- `prepackaged_plugins/` 전체 삭제: Calls·Jira 등 포크가 없는 플러그인까지 사라진다. 사용자
  요구(나머지는 유지)와 어긋난다. 기각.
- `MM_PACKAGE` 버전 고정: 공식판은 여전히 실린다. 원인과 무관하다. 기각.

## R3. Makefile 프리패키지 목록에서 어떻게 빼나?

**결정**: 일반 목록의 세 줄(163·165·166행)을 지운다. FIPS `ifeq` 블록은 **남기고**
`PLUGIN_PACKAGES =`로 비운다.

**근거**:

- `prepackaged-plugins`(Makefile 314행)와 `fetch-prepackaged-plugins`(`build/release.mk` 224행)가
  `$(PLUGIN_PACKAGES)`를 내려받는다.
- FIPS 블록(178-180행)은 일반 목록을 **덮어쓰는** 대입(`=`)이다. 세 줄을 지운 뒤 블록까지
  지우면 FIPS 빌드가 FIPS 미검증 일반 목록 10개를 내려받는다. FR-002를 어긴다.
  블록을 남기고 빈 값으로 둔다.
- 선례: 2026-11-17 user-survey 번들 제거(`98563b9f`)를 같은 목록에서 한 줄 삭제로 받았다.
  검증은 `make -n prepackaged-plugins`로 했다(divergence 문서 "user-survey 플러그인 번들 제거").

**sync 영향**: upstream의 세 플러그인 버전 올림 커밋은 이미 모두 exclude되어 있다(R4).
앞으로는 그 줄이 우리 쪽에 없으므로 충돌 사유가 "줄이 없다"로 바뀔 뿐이다. 계속 exclude한다.

## R4. ledger에 남은 일은?

**결정**: ledger 행은 고치지 않는다. 정책 결정은 divergence 문서에 적고, sync 메모리를 정정한다.

**근거**:

- 세 플러그인 번들 버전 올림 커밋 13건(`41e59bf1`, `863d581f`, `f84dd257`, `1bfa2e51`,
  `dc41b72f`, `10804f80`, `f21b0299`, `1361e922`, `443c6fdf`, `289d5e5e`, `cb4254cc`,
  `05553d08`, `26ee3a47`)이 모두 "제외된 커밋" 부록에 있다. "반영 예정"은 없다(FR-007 충족).
- 여러 행이 재검토 조건으로 "번들 정책이 정해지면 그 정책에 따른다"고 적었다. 이번 작업이
  그 정책을 정한다(번들에서 뺀다). 행마다 고치지 않고 divergence 문서에 정책 절을 하나 두어
  참조하게 한다. ledger 부록은 `upstream-sync.sh update`가 보존하는 영역이라 손으로 고친
  내용이 지워지지는 않지만, 13행을 고칠 이득이 없다.
- 메모리 `official-plugin-bundle-overwrites-fork`는 "Makefile 번들이 운영에 실린다"고 잘못
  적었다. 운영 경로는 Dockerfile의 upstream tarball이다. 구현을 마칠 때 정정한다.

## R5. 무엇으로 검증하나?

**결정**: 단위 테스트를 새로 만들지 않는다. 고치기 전과 고친 뒤의 명령 출력을 증거로 남긴다.

**근거**:

- 바뀌는 파일은 `server/Makefile`과 `server/build/Dockerfile` 둘이다. Go·TS 코드는 바뀌지 않는다.
  두 파일을 시험하는 테스트 체계가 저장소에 없다.
- 원칙 III의 "실패를 먼저 본다"는 같은 검사를 고치기 전에 돌려 세 플러그인이 **나오는** 출력으로
  남긴다. 고친 뒤 같은 검사가 0건을 내는지 본다.
  - Makefile: `make -n prepackaged-plugins` (일반), `FIPS_ENABLED=true make -n prepackaged-plugins` (FIPS).
  - Dockerfile: `docker build --target builder` 이미지에서 `ls /mattermost/prepackaged_plugins`.
- 종단 검증(SC-001·SC-002)은 로컬 서버에서 한다. `make prepackaged-plugins`로 받은 번들과
  포크 Boards로 재현하고, 고친 뒤 3회 재시작으로 확인한다. 운영 확인은 배포 뒤 플러그인 관리 화면으로 한다.
- 로컬 Docker 29.5.3이 있다. upstream tarball(약 400MB)을 받을 수 있다.
