#!/bin/bash
set -e

. $(dirname "$(readlink -f "${BASH_SOURCE[0]}")")/common.sh

mkdir -p log
touch log/.onCreateCommand.log
exec > >(tee -ai log/devcontainer.log)
exec 2>&1

# Remove any previous markers of completion.
rm -f log/.postAttachCommand.log

.devcontainer/script/build --push

# Remove default first run notice
if [ -f /workspaces/.codespaces/shared/first-run-notice.txt ]; then
  echo "Setup still in progress. Run the 'Run Build Task' command or press Cmd+Shift+B to follow along." > /workspaces/.codespaces/shared/first-run-notice.txt
fi

# Initialize and unseal vault
export VAULT_ADDR=http://0.0.0.0:8200

if ! vault status | grep -q Initialized; then
  echo "Waiting for vault to start..."
  until vault status | grep -q Initialized; do
    printf "."
  done
  echo ""
fi

if ! vault status | grep Initialized | grep -q true; then
  mkdir -p tmp
  vault operator init -key-shares=1 -key-threshold=1 > tmp/vault-init.txt
  unseal_token=$(grep 'Unseal Key 1:' tmp/vault-init.txt | awk '{print $NF}')
  echo "VAULT_UNSEAL_TOKEN=$unseal_token" > .env.development.vault_unseal_token
  root_token=$(grep 'Initial Root Token:' tmp/vault-init.txt | awk '{print $NF}')
  echo "VAULT_TOKEN=$root_token" > .env.development.vault_token
fi
