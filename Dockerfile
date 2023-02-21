# syntax=docker/dockerfile:1.4

FROM golang:1.19-bullseye as xcaddy
WORKDIR /build
ENV CADDY_VERSION=v2.6.2
RUN apt-get clean && apt-get update && \
    apt-get install -y \
    apt-transport-https \
    curl \
    debian-archive-keyring \
    debian-keyring \
    && \
    curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --no-tty --dearmor > /usr/share/keyrings/caddy-stable-archive-keyring.gpg && \
    curl -1sLf 'https://dl.cloudsmith.io/public/caddy/xcaddy/gpg.key' | gpg --no-tty --dearmor > /usr/share/keyrings/caddy-xcaddy-archive-keyring.gpg && \
    curl -1sLf 'https://dl.cloudsmith.io/public/caddy/xcaddy/debian.deb.txt' | tee -a /etc/apt/sources.list.d/caddy-stable.list && \
    apt-get update -qq && apt-get install -y xcaddy && \
    apt-get clean && rm -rf /var/lib/apt/lists/* && \
    xcaddy build ${CADDY_VERSION} \
        --with github.com/mastercactapus/caddy2-proxyprotocol

FROM python:3.10-bullseye as cased-base

RUN apt-get clean && apt-get update && \
    apt-get install -y \
    curl \
    jq \
    libksba8 \
    libexpat1 \
    libexpat1-dev \
    libnss3-tools \
    linux-libc-dev \
    lsof \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

ARG TARGETARCH
ENV TARGETARCH=${TARGETARCH:-amd64}

ENV TINI_VERSION=v0.19.0
RUN wget --no-cookies --quiet https://github.com/krallin/tini/releases/download/${TINI_VERSION}/tini-${TARGETARCH} \
    && wget --no-cookies --quiet https://github.com/krallin/tini/releases/download/${TINI_VERSION}/tini-${TARGETARCH}.sha256sum \
    && echo "$(cat tini-${TARGETARCH}.sha256sum)" | sha256sum -c \
    && mv tini-${TARGETARCH} /sbin/tini && chmod +x /sbin/tini

ENV STEP_VERSION=0.20.0
RUN echo ${TARGETARCH} && curl -LO https://github.com/smallstep/cli/releases/download/v${STEP_VERSION}/step_linux_${STEP_VERSION}_${TARGETARCH}.tar.gz && \
    tar xzvf step_linux_${STEP_VERSION}_${TARGETARCH}.tar.gz && \
    mv step_*/bin/step /usr/local/bin/step && \
    step -version && \
    rm step_linux_${STEP_VERSION}_${TARGETARCH}.tar.gz

COPY --link .nvmrc /root/
ENV NVM_VERSION=v0.39.2
RUN NODE_VERSION=$(cat /root/.nvmrc) && \
  : translate Docker standard TARGETARCH into the variants Node uses && \
   case "$TARGETARCH" in \
    amd64) NODE_ARCH='x64';; \
    arm64) NODE_ARCH='arm64';; \
    *) echo "unsupported architecture"; exit 1 ;; \
  esac && \
  : download and install system wide && \
  curl -fsSLO --compressed "https://nodejs.org/dist/v$NODE_VERSION/node-v$NODE_VERSION-linux-$NODE_ARCH.tar.xz" && \
  tar -xJf "node-v$NODE_VERSION-linux-$NODE_ARCH.tar.xz" -C /usr/local --strip-components=1 --no-same-owner && \
  : verify install && \
  node --version | grep $NODE_VERSION && \
  npm --version && \
    npm install -g yarn

RUN mkdir -p /code && \
  useradd -u 1000 -ms /bin/bash app && \
  usermod -p '*' app && \
  chown -R app:app /home/app /code
WORKDIR /code
USER app

FROM cased-base as cased-node
COPY --link --chown=1000:1000 package.json yarn.lock /code/
RUN bash -xce "COUNTER=0; until [ \$COUNTER -gt 2 ] || yarn install --frozen-lockfile --network-timeout 1000000; do COUNTER=\$(expr \$COUNTER + 1); echo retrying; done; [ \$COUNTER -lt 2 ]"
COPY --link --chown=1000:1000 *.json *.js /code/

FROM cased-base as cased-python
COPY --link --chown=1000:1000 requirements.txt /code/
RUN LIBSODIUM_MAKE_ARGS=-j4 pip install -r requirements.txt
ENV PATH=${PATH}:/home/app/.local/bin

FROM cased-node as cased-nx
COPY --link --chown=1000:1000 apps /code/apps
COPY --link --chown=1000:1000 libs /code/libs
RUN yarn run build:prod

FROM cased-python
ENTRYPOINT ["/sbin/tini", "-g", "--"]
CMD ["bash", "start"]
COPY --from=xcaddy --link /build/caddy /usr/local/bin/caddy
COPY --link --chown=1000:1000 --from=cased-node /code/node_modules /code/node_modules
COPY --link --chown=1000:1000 --from=cased-nx /code/dist/apps/shell /usr/share/caddy
COPY --link --chown=1000:1000 . /code
ARG GIT_SHA
ENV GIT_SHA=${GIT_SHA}
