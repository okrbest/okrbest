# okrbest 이미지 Dockerfile (okrbest-deploy 의 dev/prd/starter 워크플로우 공통).
# 앱 바이너리/클라이언트를 builder 가 아닌 최종 스테이지에서 별도 레이어로 복사해,
# 변경된 레이어만 레지스트리에 push 되게 한다. (2026-10, Dockerfile.dev 에서 검증 후 통합)
# First stage - Ubuntu with document processing dependencies and curl for downloading
FROM ubuntu:noble-20251013@sha256:c35e29c9450151419d9448b0fd75374fec4fff364a27f176fb458d472dfc9e54 AS builder
# Setting bash as our shell, and enabling pipefail option
SHELL ["/bin/bash", "-o", "pipefail", "-c"]

# Build Arguments
ARG PUID=2000
ARG PGID=2000
# MM_PACKAGE build arguments controls which version of mattermost to install, defaults to latest stable enterprise
# e.g. https://releases.mattermost.com/9.7.1/mattermost-9.7.1-linux-amd64.tar.gz
ARG MM_PACKAGE="https://latest.mattermost.com/mattermost-enterprise-linux"

# Install needed packages and indirect dependencies
RUN apt-get update \
  && DEBIAN_FRONTEND=noninteractive apt-get install --no-install-recommends -y \
  ca-certificates \
  curl \
  media-types \
  mailcap \
  unrtf \
  wv \
  poppler-utils \
  tidy \
  tzdata \
  && rm -rf /var/lib/apt/lists/*

# Set mattermost group/user and download Mattermost
RUN mkdir -p /mattermost/data /mattermost/plugins /mattermost/client/plugins \
  && groupadd --gid ${PGID} mattermost \
  && useradd --uid ${PUID} --gid ${PGID} --comment "" --home-dir /mattermost mattermost \
  && curl -L $MM_PACKAGE | tar -xvz \
  && chown -R mattermost:mattermost /mattermost /mattermost/data /mattermost/plugins /mattermost/client/plugins

# Create PostgreSQL client SSL directory structure for ssl_mode=require
RUN mkdir -p /mattermost/.postgresql \
  && chmod 700 /mattermost/.postgresql

# Remove mattermost server and client
RUN rm -f /mattermost/bin/mattermost \
  && rm -f /mattermost/bin/mmctl \
  && rm -rf /mattermost/client/*
# && rm -rf /mattermost/i18n/*
#  && rm -f /mattermost/config/config.json

# 앱 바이너리와 클라이언트는 여기서 복사하지 않는다 (최종 스테이지에서 별도 레이어로 복사).
# builder 단계에서 덮어쓰면 아래 `COPY --from=builder /mattermost` 레이어 전체가 매 빌드마다
# 바뀌어 수백 MB가 매번 push된다.
# COPY --chown=mattermost:mattermost --chmod=755 ../i18n/* /mattermost/i18n
# COPY --chown=mattermost:mattermost --chmod=755 ../config/config.json /mattermost/config/config.json

# Final stage using distroless for minimal attack surface
FROM gcr.io/distroless/base-debian12

# Some ENV variables
ENV PATH="/mattermost/bin:${PATH}"
ENV MM_SERVICESETTINGS_ENABLELOCALMODE="true"
ENV MM_INSTALL_TYPE="docker"

# Copy over metadata files needed by runtime
COPY --from=builder /etc/mime.types /etc

# Copy CA certificates for SSL/TLS validation with proper ownership
COPY --from=builder --chown=2000:2000 /etc/ssl/certs /etc/ssl/certs

# Copy document processing utilities and necessary support files
COPY --from=builder /usr/bin/pdftotext /usr/bin/pdftotext
COPY --from=builder /usr/bin/wvText /usr/bin/wvText
COPY --from=builder /usr/bin/wvWare /usr/bin/wvWare
COPY --from=builder /usr/bin/unrtf /usr/bin/unrtf
COPY --from=builder /usr/bin/tidy /usr/bin/tidy
COPY --from=builder /usr/share/wv /usr/share/wv

# Copy necessary libraries for document processing utilities
COPY --from=builder /usr/lib/libpoppler.so* /usr/lib/
COPY --from=builder /usr/lib/libfreetype.so* /usr/lib/
COPY --from=builder /usr/lib/libpng.so* /usr/lib/
COPY --from=builder /usr/lib/libwv.so* /usr/lib/
COPY --from=builder /usr/lib/libtidy.so* /usr/lib/
COPY --from=builder /usr/lib/libfontconfig.so* /usr/lib/

# 1) 바뀌지 않는 부분(업스트림 패키지·prepackaged 플러그인): 빌드 캐시가 유지되면
#    같은 레이어 digest가 나와 push 시 "Layer already exists"로 건너뛴다.
COPY --from=builder --chown=2000:2000 /mattermost /mattermost

# 2) 매 빌드마다 바뀌는 부분만 별도 레이어로 올린다. push되는 양이 이 세 레이어로 줄어든다.
#    passwd 복사 전이라 사용자 이름 대신 숫자 UID/GID(2000)를 쓴다.
#    dist/client/* (와일드카드)는 하위 디렉터리를 평탄화한다 — files/ 안의 폰트·CSS가
#    /mattermost/client 최상위로 쏟아져 /static/files/... 가 전부 404가 된다.
#    디렉터리를 통째로 넘겨야 구조가 보존된다.
COPY --chown=2000:2000 --chmod=755 dist/server/mattermost /mattermost/bin/mattermost
COPY --chown=2000:2000 --chmod=755 dist/server/mmctl /mattermost/bin/mmctl
COPY --chown=2000:2000 dist/client /mattermost/client

# Copy passwd including mattermost user
COPY  passwd /etc/passwd

# We should refrain from running as privileged user
USER mattermost

# Healthcheck to make sure container is ready - using mmctl instead of curl for distroless compatibility
HEALTHCHECK --interval=30s --timeout=10s \
  CMD ["/mattermost/bin/mmctl", "system", "status", "--local"]

# Configure entrypoint and command with proper permissions
WORKDIR /mattermost
CMD ["/mattermost/bin/mattermost"]

EXPOSE 8065 8067 8074

# Declare volumes for mount point directories
VOLUME ["/mattermost/data", "/mattermost/logs", "/mattermost/config", "/mattermost/plugins", "/mattermost/client/plugins"]
