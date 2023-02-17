
.PHONY: clean test
test: _ci/bin/bats
	./_ci/bin/bats */ci/*.bats
clean:
	rm -rf */*.out _ci/bin _ci/lib _ci/libexec _ci/share _ci/tmp

BATS_VERSION=v1.9.0
_ci/bin/bats:
	mkdir -p _ci
	curl -sSL https://github.com/bats-core/bats-core/archive/$(BATS_VERSION).tar.gz -o /tmp/bats.tgz \
		&& tar -zxf /tmp/bats.tgz -C _ci \
		&& /bin/bash _ci/bats-core-*/install.sh _ci \
		&& rm -rf _ci/bats-core-*

