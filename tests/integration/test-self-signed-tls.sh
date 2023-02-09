#!/bin/bash
set -e -o pipefail

# Confirm that self-signed certs can be obtained when accessing the host at another name
curl --fail -vk --max-time 5 --resolve cased-shell-8443:8443:127.0.0.1 https://cased-shell-8443:8443/ > /tmp/tls.out 2> /tmp/tls.err
grep "certificate obtained successfully" /tmp/log | grep cased-shell-8443
grep "CN=Caddy Local" /tmp/tls.err
grep " 200 " /tmp/tls.err
! grep -i "server: CasedShell" /tmp/tls.err

# Test without SNI
curl -0 --fail -vk --max-time 5 https://127.0.0.1:8443/ > /tmp/tls.out 2> /tmp/tls.err
grep "certificate obtained successfully" /tmp/log | grep 127.0.0.1
grep "CN=Caddy Local" /tmp/tls.err
grep " 200 " /tmp/tls.err
! grep -i "server: CasedShell" /tmp/tls.err

# Test HTTP1.0 health checks without SNI
[ -n "$GIT_SHA" ]
curl -0 --fail -sk --max-time 1 https://127.0.0.1:8443/_health | grep "ok $GIT_SHA"

# Test NX apps
curl --fail -k -v --max-time 1 https://127.0.0.1:8443/ > /tmp/nx.out 2> /tmp/nx.err
grep '<base href="/">' /tmp/nx.out

# Test NX fallback
curl --fail -k -v --max-time 1 https://127.0.0.1:8443/some-undefined-path > /tmp/nx.out 2> /tmp/nx.err
grep '<base href="/">' /tmp/nx.out

# Download all NX assets
grep -oP "(?<=src=\")[^\"]+(?=\")" /tmp/nx.out | while IFS= read -r line ; do
  name=$(basename "$line" | cut -f 1 -d .)
  curl --fail -k -v --max-time 1 https://127.0.0.1:8443"$line" > /tmp/"$name".js.out 2> /tmp/"$name".js.err
done
