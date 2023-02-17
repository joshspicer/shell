#!/usr/bin/env bats

load helpers.bash

@test "helm defaults: ingress hostname uses default" {
  cat "$yamldir/Ingress-csh-v1-cased-shell.yml"
  yq '.spec.rules[0].host' "$yamldir/Ingress-csh-v1-cased-shell.yml" -- | grep shell.example.com
}

