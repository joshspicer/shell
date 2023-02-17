: "${NAMESPACE:=default}"
: "${NAME:=csh-v1}"

function setup_file() {
  values=$(dirname "$BATS_TEST_FILENAME")/$(basename "$BATS_TEST_FILENAME" .bats).yaml
  yaml=$(dirname "$BATS_TEST_FILENAME")/$(basename "$BATS_TEST_FILENAME" .bats).out

  # Render the chart into a multi-document YAML file named $yaml
	helm template --namespace "${NAMESPACE}" -f "$values" "$NAME" "$(dirname "$BATS_TEST_FILENAME")/.." > "$yaml"
  test -f "$yaml"
  export yaml

  yamldir=$(dirname "$BATS_TEST_FILENAME")/tmp/$(basename "$BATS_TEST_FILENAME" .bats)
  rm -rf "$yamldir"
  mkdir -p "$yamldir"

  # Split the documents in the multi-document YAML into a dir named $yamldir
  docker run -i --rm -u=0 -v "${PWD}":"${PWD}" -w "${PWD}" \
    mikefarah/yq:4 \
    -s "\"${yamldir}/\" + .kind + \"-\" + .metadata.name" \
    "$yaml"
  test -f "$yamldir/ConfigMap-${NAME}-cased-shell.yml"
  export yamldir
}

function yq() {
  docker run --rm -i -v "${PWD}":"${PWD}" -w "${PWD}" mikefarah/yq "$@"
}

function teardown_file() {
  rm -rf "$yamldir"
}
