#!/bin/bash

export DOCKER_BUILDKIT=1
export BUILDKIT_PROGRESS=plain
GIT_SHA="$(git rev-parse --short HEAD)"
export GIT_SHA
: "${REGISTRY:=registry:5000}"
export REGISTRY

TARGETARCH=""
case $(uname -m) in
    x86_64) TARGETARCH="amd64" ;;
    arm)    dpkg --print-architecture | grep -q "arm64" && TARGETARCH="arm64" || TARGETARCH="arm" ;;
esac
export TARGETARCH

# Create a custom builder that can read from the GHA cache
# (https://docs.docker.com/build/cache/backends/gha/) and push to our local
# registry.
docker buildx install
if docker buildx inspect | grep -q docker-container; then
  :
else
  docker buildx create --use \
    --name=docker-container \
    --driver-opt "network=shell_devcontainer_default" \
    --config "$(dirname "$(readlink -f "${BASH_SOURCE[0]}")")/buildkit.toml"
  echo "FROM scratch" | docker buildx build -
fi

# Output the name of a devcontainer, handling the difference in separator
# between Docker Compose v1 and v2 on the host.
# Amusingly, Docker Compose v1 is running inside the container, so we need to
# use the name of the created containers to infer what version they were created
# with.
function devcontainer_name() {
  devcontainer_separator="_"
  if docker ps -a 2>/dev/null | grep -q -- -app-1; then
    devcontainer_separator="-"
  else
    :
  fi
  printf "${NAME_WITHOUT_OWNER:-shell}_devcontainer${devcontainer_separator}${1}${devcontainer_separator}1"
}

function waitForPort() {
    if ! nc -z localhost $1; then
    printf "Waiting for localhost:$1 to be ready..."
    until nc -z localhost $1; do
      printf "."
      sleep 1
    done
    echo "ready!"
  fi
}

function waitForRegistry() {
  printf "Waiting for $1..."
  SECONDS=0
  until curl --fail -s --max-time 1 $1/v2/ || [ $SECONDS -gt 10 ]; do
      printf .
      sleep 1
  done

  if curl --fail -s --max-time 1 $1/v2/; then
    echo ok
  else
    echo "can't connect to $1/v2/"
    set -x
    curl -v $1/v2/
    return false
  fi

  if [ -n "$2" ]; then
    image="$2"
    docker pull $image
    docker tag $image $1/$image
    SECONDS=0
    echo "Pushing $1/$image..."
    until docker push $1/$image || [ $SECONDS -gt 15 ]; do
      printf .
      sleep 1
    done && docker push $1/$image 2>/dev/null
  fi
}
