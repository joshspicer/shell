#!/bin/bash

set -e

test -f /etc/ssh/ssh_host_rsa_key || dpkg-reconfigure openssh-server

printf "Waiting for %s to be ready..." \
  "${CASED_SHELL_ENDPOINT}${PING_PATH}"
until curl --fail -s --max-time 3 -k "${CASED_SHELL_ENDPOINT}${PING_PATH}"; do
  sleep 3
  printf .
done
echo "ready!"

prefix=/v2/

until [ -s /home/app/.ssh/authorized_keys ]; do
  printf "Importing CA config from %s ... " \
    "${CASED_SHELL_ENDPOINT}${prefix}"
  if curl -s --fail -k "${CASED_SHELL_ENDPOINT}${prefix}principal.txt" > /dev/null; then
    line="$(curl -s --fail -k "${CASED_SHELL_ENDPOINT}${prefix}.ssh/authorized_keys" || true)"
    if [ -z "$line" ]; then
      echo " none found"
      sleep 3
      continue
    fi
    echo ok
    keys=/home/app/.ssh/authorized_keys
    if grep "$line" $keys; then
      echo "Key already exists in $keys"
      break
    else
      echo "Added $line to $keys"
      echo "$line" >> $keys
      break
    fi
  else
    echo " none found"
    sleep 3
  fi
done

chown -R app /home/app
chmod 700 /home/app/.ssh
chmod 600 /home/app/.ssh/authorized_keys

exec /usr/sbin/sshd '-o LogLevel=VERBOSE' -D -e
