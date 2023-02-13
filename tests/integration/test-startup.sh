#!/bin/bash
set -e

[ -n "$GIT_SHA" ]
# Wait for Shell to start
while true; do
    curl -s --fail --max-time 1 localhost:8888/_ping | grep "$GIT_SHA" && break
    if [ "$SECONDS" -gt "15" ]; then
        echo "Cased Shell took $SECONDS to start, longer than our 15s goal" 2>&1
        env
        cat /tmp/log 1>&2
        exit 1
    fi
    sleep 1
done

# validate new /v2/_ping endpoint
curl -s --fail --max-time 1 localhost:8888/v2/_ping | grep "$GIT_SHA"