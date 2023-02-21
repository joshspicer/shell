#!/bin/bash
set -e

mkdir -p log
exec > >(tee -ai log/devcontainer.log)
exec 2>&1

if grep -q CODESPACE_NAME= /root/.codespaces/shared/.env 2>/dev/null; then
  echo DEVCONTAINER_ENV_FILE=../.env >> .devcontainer/.env

  # Make select Codespaces env available to containers
  grep CODESPACES= /root/.codespaces/shared/.env >> .env
  grep CODESPACE_NAME= /root/.codespaces/shared/.env >> .env
  grep GITHUB_REPOSITORY= /root/.codespaces/shared/.env >> .env
  (grep OAUTH_ /root/.codespaces/shared/.env || true) >> .env
  (grep SAML_ /root/.codespaces/shared/.env || true) >> .env
  (grep OIDC_ /root/.codespaces/shared/.env || true) >> .env
  source .env
fi

if [ -n "$GITHUB_REPOSITORY" ]; then
  echo "NAME_WITHOUT_OWNER=$(echo $GITHUB_REPOSITORY | cut -f 2 -d /)" >> .env

fi

if [ -n "$CODESPACE_NAME" ]; then
  rm -f .env.development.cased_shell_hostname
  # Set CASED_URL_HOSTNAME
  echo "CASED_SHELL_HOSTNAME=${CODESPACE_NAME}-8889.${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN}" >> .env
  echo "CASED_URL_PROTOCOL=https" >> .env
  source .env
  echo "CASED_DEV_ASSET_URL=${CASED_URL_PROTOCOL}://${CASED_URL_HOSTNAME}" >> .env
  echo "CASED_URL_PORT=" >> .env
  source .env
else
  source .env
  # Local remote containers
  echo "CASED_SHELL_HOSTNAME=localhost:8888" > .env.development.cased_shell_hostname
fi

if ! [ -f ./tmp/cased-server/tls/cert.pem ]; then
  .devcontainer/script/gen-keypair cased-server
fi

if ! [ -f ./tmp/dex/tls/cert.pem ]; then
  .devcontainer/script/gen-keypair dex
fi
