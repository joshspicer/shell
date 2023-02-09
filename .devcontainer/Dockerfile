# syntax=docker/dockerfile:1.4

# Use a multi-arch manifest digest here
# docker buildx imagetools inspect mcr.microsoft.com/vscode/devcontainers/python:3-bullseye
FROM mcr.microsoft.com/vscode/devcontainers/python:3-bullseye@sha256:1706e36a918d50122bb92c7f6702a80a1db8d09b94d0912bc69ba993ca011bbc as cased-devcontainer-base
ARG TARGETARCH
ENV TARGETARCH=${TARGETARCH:-amd64}

FROM cased-devcontainer-base as cased-step
ENV STEP_VERSION=0.20.0
RUN echo ${TARGETARCH} && curl -LO https://github.com/smallstep/cli/releases/download/v${STEP_VERSION}/step_linux_${STEP_VERSION}_${TARGETARCH}.tar.gz && \
    tar xzvf step_linux_${STEP_VERSION}_${TARGETARCH}.tar.gz && \
    mv step_*/bin/step /usr/local/bin/step && \
    step -version && \
    rm step_linux_${STEP_VERSION}_${TARGETARCH}.tar.gz

FROM cased-devcontainer-base as cased-chart-testing
ENV CHART_TESTING_VERSION=3.7.1
RUN echo ${TARGETARCH} && curl -LO https://github.com/helm/chart-testing/releases/download/v${CHART_TESTING_VERSION}/chart-testing_${CHART_TESTING_VERSION}_linux_${TARGETARCH}.tar.gz && \
    tar xzvf chart-testing_${CHART_TESTING_VERSION}_linux_${TARGETARCH}.tar.gz && \
    mv ct /usr/local/bin/ct && \
    ct version && \
    rm chart-testing_${CHART_TESTING_VERSION}_linux_${TARGETARCH}.tar.gz

FROM cased-devcontainer-base as cased-aws
ARG AWS_IAM_AUTHENTICATOR_VERSION=v0.5.7
RUN curl -sL -o aws-iam-authenticator https://github.com/kubernetes-sigs/aws-iam-authenticator/releases/download/${AWS_IAM_AUTHENTICATOR_VERSION}/aws-iam-authenticator_0.5.7_linux_amd64 && \
    chmod +x ./aws-iam-authenticator && \
    mv ./aws-iam-authenticator /usr/local/bin/aws-iam-authenticator

FROM cased-devcontainer-base as cased-golang
ARG GO_VERSION=1.19.3
RUN curl -sL -o /tmp/go.tar.gz https://go.dev/dl/go${GO_VERSION}.linux-${TARGETARCH}.tar.gz && \
    tar -C /usr/local -xzf /tmp/go.tar.gz \
    && rm /tmp/go.tar.gz && \
    ln -s /usr/local/go/bin/go /usr/local/bin/go

FROM cased-devcontainer-base as cased-helm
ENV HELM_VERSION=3.11.0
RUN curl -1sLf --connect-timeout 30 --retry 3 https://raw.githubusercontent.com/devcontainers/features/main/src/kubectl-helm-minikube/install.sh > /usr/local/bin/kubectl-helm-minikube.sh && \
    chmod +x /usr/local/bin/kubectl-helm-minikube.sh && \
    HELM=${HELM_VERSION} /usr/local/bin/kubectl-helm-minikube.sh

FROM cased-golang as cased-caddy
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
        --with github.com/mastercactapus/caddy2-proxyprotocol && \
    mv caddy /usr/local/bin/caddy && \
    caddy version

FROM cased-devcontainer-base as cased-devcontainer
# OS
RUN curl -fsSL -o /usr/share/keyrings/githubcli-archive-keyring.gpg https://cli.github.com/packages/githubcli-archive-keyring.gpg &&  \
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | \
    tee /etc/apt/sources.list.d/github-cli.list > /dev/null && \
    wget -O- https://apt.releases.hashicorp.com/gpg | gpg --dearmor | sudo tee /usr/share/keyrings/hashicorp-archive-keyring.gpg && \
    echo "deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com $(lsb_release -cs) main" | \
    tee /etc/apt/sources.list.d/hashicorp.list > /dev/null && \
    apt-get clean && \
    apt-get update && \
    export DEBIAN_FRONTEND=noninteractive && \
    apt-get install -y \
    bc \
    curl \
    jq \
    gh \
    libexpat1 \
    libexpat1-dev \
    libksba8 \
    libnss3-tools \
    linux-libc-dev \
    lsof \
    netcat-openbsd \
    openssh-server \
    socat \
    sysstat \
    libgtk2.0-0 \
    libgtk-3-0 \
    libgbm-dev \
    libnotify-dev \
    libgconf-2-4 \
    libnss3 \
    libxss1 \
    libasound2 \
    libxtst6 \
    postgresql-client \
    vault \
    xauth \
    xvfb \
    && \
    curl -1sLf https://github.com/microsoft/vscode-dev-containers/raw/main/script-library/docker-debian.sh > /usr/local/bin/docker-debian.sh && \
    chmod +x /usr/local/bin/docker-debian.sh && \
    /usr/local/bin/docker-debian.sh true /var/run/docker-host.sock /var/run/docker.sock automatic ${_BUILD_ARG_DOCKER_FROM_DOCKER_MOBY:-true} ${_BUILD_ARG_DOCKER_FROM_DOCKER_VERSION:-latest} && \
    test -x /usr/local/share/docker-init.sh && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

ENTRYPOINT [ "/usr/local/share/docker-init.sh" ]

# Node
COPY --link .nvmrc /tmp/
RUN su vscode -c "umask 0002 && . /usr/local/share/nvm/nvm.sh && nvm install $(cat /tmp/.nvmrc) 2>&1 && nvm alias default $(cat /tmp/.nvmrc)"

FROM cased-devcontainer as cased-node
COPY --link --chown=1000:1000 package.json yarn.lock /code/
RUN (rm -rf /tmp/yarn-* || true) && su vscode -c "\
    npm install -g npm; \
    npm install -g yarn; \
    mkdir -p ~/.tmp; \
    export TMPDIR=~/.tmp; \
    cd /code; \
    COUNTER=0; \
    until [ \$COUNTER -gt 2 ] || yarn install --frozen-lockfile --network-timeout 1000000; do \
        COUNTER=\$(expr \$COUNTER + 1); \
        cat /code/yarn-error.log || true ; \
        ls -alth /tmp/yarn* || true; \
        echo retrying...; \
    done; \
    rm -rfv ~/.tmp || true; \
    [ \$COUNTER -lt 2 ]"

FROM cased-devcontainer
ENV PATH=${PATH}:/home/vscode/.local/bin:/home/vscode/go/bin
COPY --link --from=cased-step /usr/local/bin/step /usr/local/bin/step
COPY --link --from=cased-chart-testing /usr/local/bin/ct /usr/local/bin/ct
COPY --link --from=cased-aws /usr/local/bin/aws-iam-authenticator /usr/local/bin/aws-iam-authenticator
COPY --link --from=cased-golang /usr/local/go /usr/local/go
COPY --link --from=cased-golang /usr/local/bin/go /usr/local/bin/go
COPY --link --from=cased-helm /usr/local/bin/kubectl /usr/local/bin/kubectl
COPY --link --from=cased-helm /usr/local/bin/helm /usr/local/bin/helm
COPY --link --from=cased-caddy /usr/local/bin/caddy /usr/local/bin/caddy

COPY --link --chown=1000:1000 requirements.txt /code/
RUN su vscode -c "cd /code; LIBSODIUM_MAKE_ARGS=-j4 pip3 --disable-pip-version-check install -r /code/requirements.txt"

COPY --link --from=cased-node --chown=1000:1000 /code/node_modules /code/node_modules

COPY --link --chown=1000:1000 . /code

