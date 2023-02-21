#!/bin/bash
set -e

. $(dirname "$(readlink -f "${BASH_SOURCE[0]}")")/common.sh

# Load environment in all terminals launched after this one
cat << EOF >> ~/.bashrc
set -o allexport
for f in \$(ls .env.development*); do
  if . \$f; then
    :
  else
    echo "Failed to load environment from $f"
  fi
done
set +o allexport
EOF

# Load all dev environment here
set -o allexport
for f in $(ls .env.development*); do . $f; done
source .env
set +o allexport

mkdir -p log
exec > >(tee -ai log/devcontainer.log)
exec 2>&1

# Remove any previous markers of completion.
rm -f log/.postAttachCommand.log

# Remove default first run notice
if [ -f /workspaces/.codespaces/shared/first-run-notice.txt ]; then
  echo "Setup still in progress. Run the 'Run Build Task' command or press Cmd+Shift+B to follow along." > /workspaces/.codespaces/shared/first-run-notice.txt
fi

pip install -r requirements.txt

# Copy node modules into the workspace if not already present
if  [ -d /code/node_modules ] && \
    ! [ -d /workspaces/shell/node_modules ]; then
  mv /code/node_modules /workspaces/shell/
fi

COUNTER=0; until [ $COUNTER -gt 2 ] || yarn install --frozen-lockfile --network-timeout 1000000; do COUNTER=$(expr $COUNTER + 1); echo "attempt $COUNTER failed, retrying"; done; [ $COUNTER -lt 2 ]

waitForPort 5534
SECONDS=0
until yarn run migrate up; do
  if [ "$SECONDS" -gt "30" ]; then
      echo "migrate failed after ${SECONDS}s" 2>&1
      exit 1
  fi
  printf .
  sleep 1
done
waitForPort 5536
SECONDS=0
until yarn run test-migrate up; do
  if [ "$SECONDS" -gt "30" ]; then
      echo "migrate failed after ${SECONDS}s" 2>&1
      exit 1
  fi
  printf .
  sleep 1
done

go install github.com/norwoodj/helm-docs/cmd/helm-docs@latest
GOPRIVATE=github.com go install github.com/cased/cased-cli@latest

( timeout 120 .devcontainer/script/build --push ) || true