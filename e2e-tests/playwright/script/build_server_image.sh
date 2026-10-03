#!/bin/bash
# Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
# See LICENSE.txt for license information.
#
# okrbest 서버 이미지를 로컬에서 만든다. testcontainers 모드가 SERVER_IMAGE로 받는 그 이미지다.
#
# 왜 스크립트인가 — 절차에 함정이 넷 있어 손으로 반복하면 틀린다.
#   1. server/build/Dockerfile(39-48행, okrbest 자체 수정)이 빌드 컨텍스트의
#      dist/server/{mattermost,mmctl}·dist/client/*를 요구하는데 저장소가 그 디렉터리를
#      만들어 주지 않는다.
#   2. MM_PACKAGE의 curl은 빌드 컨테이너 안에서 돈다 → file:// 로는 호스트 파일이 안 보인다.
#   3. macOS BSD tar가 AppleDouble(._*)과 LIBARCHIVE.xattr 헤더를 넣고, Makefile이 멤버로
#      ../mattermost를 넘겨서 컨테이너의 GNU tar가 거부한다(exit 2).
#   4. 최종 이미지가 distroless다 → 셸이 없어 docker run ... sh -c 로 검사할 수 없다.
#
# 자세한 근거: specs/013-e2e-testcontainers-stack/research.md D2
#
# 사용법:
#   ./build_server_image.sh                  # 전체 (웹앱 빌드 포함)
#   ./build_server_image.sh --skip-make      # make 산출물 재사용 (반복 실행용)
#   IMAGE=myorg/mm:dev ./build_server_image.sh
set -euo pipefail

IMAGE="${IMAGE:-okrbest/server:local}"
SKIP_MAKE=0
[ "${1:-}" = "--skip-make" ] && SKIP_MAKE=1

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
SERVER_DIR="$REPO_ROOT/server"

# 호스트 아키텍처에 맞춘다. arm64 Mac에서 amd64 이미지를 쓰면 qemu 에뮬레이션이 붙어
# 기동이 느려지고 간헐 실패가 늘어난다.
case "$(uname -m)" in
  arm64|aarch64) ARCH=arm64 ;;
  x86_64|amd64)  ARCH=amd64 ;;
  *) echo "지원하지 않는 아키텍처: $(uname -m)" >&2; exit 1 ;;
esac

STAGE="$(mktemp -d "${TMPDIR:-/tmp}/okrbest-image.XXXXXX")"
HTTP_PID=""
cleanup() {
  [ -n "$HTTP_PID" ] && kill "$HTTP_PID" 2>/dev/null || true
  rm -rf "$STAGE"
}
trap cleanup EXIT

echo "==> 아키텍처: linux/$ARCH   이미지: $IMAGE"

# (1) 웹앱 + 바이너리 + dist 트리
if [ "$SKIP_MAKE" -eq 0 ]; then
  echo "==> [1/5] make build-client build-linux-$ARCH package-linux-$ARCH"
  ( cd "$SERVER_DIR" && make build-client "build-linux-$ARCH" "package-linux-$ARCH" )
else
  echo "==> [1/5] 건너뜀 (--skip-make)"
  for f in "$SERVER_DIR/bin/linux_$ARCH/mattermost" "$SERVER_DIR/bin/linux_$ARCH/mmctl" "$SERVER_DIR/dist/mattermost"; do
    [ -e "$f" ] || { echo "없음: $f — --skip-make 를 빼고 다시 돌린다" >&2; exit 1; }
  done
fi

# (2) GNU tar가 받아들이는 단일 루트 tarball을 만든다 (함정 3)
echo "==> [2/5] tarball 생성"
mkdir -p "$STAGE/mattermost/bin" "$STAGE/mattermost/logs"
cp -R "$SERVER_DIR/dist/mattermost/." "$STAGE/mattermost/"
cp "$SERVER_DIR/bin/linux_$ARCH/mattermost" "$SERVER_DIR/bin/linux_$ARCH/mmctl" "$STAGE/mattermost/bin/"
TARBALL="okrbest-$ARCH.tar.gz"
( cd "$STAGE" && COPYFILE_DISABLE=1 tar --no-xattrs --exclude '._*' -czf "$TARBALL" mattermost )

BAD="$(tar -tzf "$STAGE/$TARBALL" | grep -cE '^\.\./|/\._|^\._' || true)"
if [ "$BAD" -ne 0 ]; then
  echo "tarball에 거부될 항목이 $BAD 개 있다 (../ 또는 AppleDouble)" >&2
  exit 1
fi
echo "    $TARBALL — 거부 항목 0"

# (3) 빌드 컨텍스트를 꾸민다 (함정 1)
echo "==> [3/5] 빌드 컨텍스트 구성"
rm -rf "$SERVER_DIR/build/dist"
mkdir -p "$SERVER_DIR/build/dist/server" "$SERVER_DIR/build/dist/client"
cp "$SERVER_DIR/bin/linux_$ARCH/mattermost" "$SERVER_DIR/bin/linux_$ARCH/mmctl" "$SERVER_DIR/build/dist/server/"
cp -R "$REPO_ROOT/webapp/channels/dist/." "$SERVER_DIR/build/dist/client/"
[ -f "$SERVER_DIR/build/dist/client/root.html" ] || { echo "웹앱 번들에 root.html이 없다" >&2; exit 1; }

# (4) tarball을 HTTP로 서빙한다 (함정 2)
echo "==> [4/5] tarball HTTP 서빙"
PORT="$(python3 -c 'import socket;s=socket.socket();s.bind(("",0));print(s.getsockname()[1]);s.close()')"
( cd "$STAGE" && exec python3 -m http.server "$PORT" --bind 0.0.0.0 ) >/dev/null 2>&1 &
HTTP_PID=$!
disown "$HTTP_PID" 2>/dev/null || true   # 종료 시 셸의 "Terminated" 잡 메시지를 막는다
for _ in $(seq 1 20); do
  curl -sfI "http://localhost:$PORT/$TARBALL" >/dev/null 2>&1 && break
  sleep 0.5
done
curl -sfI "http://localhost:$PORT/$TARBALL" >/dev/null || { echo "HTTP 서버가 뜨지 않았다" >&2; exit 1; }
echo "    포트 $PORT"

# (5) 빌드
echo "==> [5/5] docker build"
( cd "$SERVER_DIR/build" && docker build \
    --build-arg MM_PACKAGE="http://host.docker.internal:$PORT/$TARBALL" \
    -t "$IMAGE" . )

# 온전성 검증 — distroless라 셸이 없다 (함정 4)
echo "==> 검증"
docker run --rm --entrypoint /mattermost/bin/mattermost "$IMAGE" version

CID="$(docker create "$IMAGE")"
FAIL=0
for p in /mattermost/client/root.html /mattermost/config /mattermost/data \
         /mattermost/logs /mattermost/plugins /mattermost/templates /mattermost/i18n/ko.json; do
  if docker cp "$CID:$p" - >/dev/null 2>&1; then
    echo "    OK      $p"
  else
    echo "    MISSING $p"; FAIL=1
  fi
done
docker rm -f "$CID" >/dev/null

if [ "$FAIL" -ne 0 ]; then
  echo "이미지가 온전하지 않다. 웹 UI 번들이 빠진 이미지는 /api/v4/system/ping 에는 답하면서" >&2
  echo "브라우저 테스트만 깨뜨린다 — 실패가 제품 결함처럼 보인다." >&2
  exit 1
fi

echo
echo "완료: $IMAGE"
echo "사용: SERVER_IMAGE=$IMAGE npm run test:full"
