# 검증 가이드: 서버 배포물에서 포크 플러그인의 공식판을 뺀다

**기능**: [spec.md](spec.md) · **근거**: [research.md](research.md)

각 시나리오는 **고치기 전에 한 번, 고친 뒤에 한 번** 돌린다. 고치기 전 출력이 원칙 III의
"실패를 먼저 본" 증거다. 두 출력을 모두 `tasks.md`의 해당 과제 옆에 남긴다.

## 선행 조건

- 작업 브랜치 `034-unbundle-forked-plugins`
- Docker(로컬 29.5.3 확인), 인터넷 연결(upstream tarball 약 400MB)
- 종단 검증용: 로컬 PostgreSQL(비밀번호 `mostest_password`), Node v24, 포크 Boards 클론
  `/mnt/d/okrbest/okrbest-plugin-boards`

## Q1. 운영 이미지에 세 공식판이 없다 (SC-003, FR-001)

```bash
cd /mnt/d/okrbest/okrbest/server/build
docker build --target builder -f Dockerfile -t okrbest-builder-check .
docker run --rm okrbest-builder-check ls /mattermost/prepackaged_plugins \
  | tee /tmp/prepackaged-after.txt
grep -cE 'mattermost-plugin-(playbooks|boards|agents)-v' /tmp/prepackaged-after.txt
```

- **고치기 전**: 세 플러그인의 `.tar.gz`·`.sig` 6줄이 보인다. grep 결과는 `6`이다.
- **고친 뒤**: grep 결과는 `0`이다. 나머지 파일은 고치기 전 목록과 같다
  (`diff`로 세 플러그인 6줄만 빠졌는지 본다. 12.1.0 기준 24개 파일, 12개 플러그인).
- 빌드 캐시를 쓰면 tarball 레이어는 재사용되고 삭제 단계만 다시 돈다. 두 목록이 같은
  tarball에서 나왔는지 확인한다.

## Q2. `make` 배포물이 세 공식판을 내려받지 않는다 (SC-005, FR-002)

```bash
cd /mnt/d/okrbest/okrbest/server
make -n prepackaged-plugins | grep -o 'for plugin_package in [^;]*'
FIPS_ENABLED=true make -n prepackaged-plugins | grep -o 'for plugin_package in [^;]*'
```

- **고치기 전**: 일반 목록 13개에 playbooks·agents·boards가 있다. FIPS 목록은 그 셋뿐이다.
- **고친 뒤**: 일반 목록은 10개이고 셋이 없다. FIPS 목록은 비어 있다. FIPS 목록이 일반 목록
  10개로 바뀌어 있으면 실패다(R3).

## Q3. 서버를 재시작해도 포크가 그대로다 (SC-001, SC-002, FR-004)

로컬 서버로 운영 상황을 재현한다. Boards 하나로 본다. 세 플러그인의 설치 경로는 같고,
Boards는 파일 저장소까지 바꿀 수 있는 가장 나쁜 경우다.

**프리패키지는 Makefile 번들이 아니라 Q1의 builder 이미지에서 꺼낸다.** 2026-11-18 실측에서
Makefile이 받는 공식 Boards 9.3.0 번들은 manifest에 `version`이 없었다. 그래서 이미 설치된
포크와 버전을 비교하다 `invalid_version`으로 실패해 덮어쓰지 못한다. 운영 tarball(12.1.0)의
세 번들은 버전이 정상이라 실제로 덮어쓴다. 운영 경로를 재현하려면 이미지의 디렉터리를 써야 한다.

**사용자 개발 서버(8065)와 섞지 않는다.** 같은 `config.json`으로 두 번째 서버를 띄우면 DB와
`plugins/`를 공유해 사용자 환경을 건드린다. 별도 설정으로 띄운다: 포트 8066, 새 DB(`mm_spec034`),
scratchpad의 `PluginSettings.Directory`·`ClientDirectory`·`FileSettings.Directory`,
별도 `LocalModeSocketLocation`. 실행은 `MM_CONFIG=<격리 config>`로, mmctl은
`MMCTL_LOCAL_SOCKET_PATH=<격리 소켓>`으로 한다.

1. 포크 Boards 번들을 만든다(nil 가드가 든 `origin/main`):
   `git worktree add --detach /tmp/boards-main origin/main && cd /tmp/boards-main && make dist-linux`
   → `dist/boards-9.2.4.tar.gz`
2. 프리패키지 디렉터리를 이미지에서 채운다:
   `cd server && rm -rf prepackaged_plugins && CID=$(docker create okrbest-builder-check:<before|after>) && docker cp "$CID:/mattermost/prepackaged_plugins" ./prepackaged_plugins && docker rm -f "$CID"`
3. 격리 서버를 띄우고 포크를 올려 켠다:
   `bin/mmctl --local plugin add --force /tmp/boards-main/dist/boards-9.2.4.tar.gz && bin/mmctl --local plugin enable focalboard`
4. 서버를 멈췄다가 다시 띄운다. 매번 `bin/mmctl --local plugin list`로 `focalboard` 버전을 본다.
   로그에서 `plugin_id=focalboard`와 `Removing existing installation`을 찾는다.

- **고치기 전**(`:before` 이미지): 첫 재시작 뒤 버전이 공식판(10.1.0)으로 바뀐다. 로그에
  덮어쓰기 메시지가 있다. 공식 Boards가 DB 마이그레이션에 실패해 활성화되지 않는다.
- **고친 뒤**(`:after` 이미지로 2단계를 다시 한 뒤): 3회 연속 재시작해도 버전이 9.2.4다.
  보드 화면이 열린다. 재배포는 0회다.

## Q4. 운영 확인 (배포 뒤)

수정본으로 운영 이미지를 배포한 뒤 시스템 콘솔 → 플러그인 관리에서 세 플러그인 버전을 본다.
배포 전 값(Agents `0.0.0+a98c27c`, Boards `9.2.4`, Playbooks `2.5.0+dbd595e1`)과 같아야
한다. 다음 재시작 뒤에 한 번 더 본다.

배포 전에 서버가 재시작되면 기존 이미지 때문에 세 플러그인이 공식판으로 바뀐다. 그러면
수정본을 배포한 뒤 포크를 한 번 재배포한다(spec 경계 사례).
