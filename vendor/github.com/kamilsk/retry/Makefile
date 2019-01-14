OPEN_BROWSER       =
SUPPORTED_VERSIONS = 1.5 1.6 1.7 1.8 1.9 1.10 latest


include makes/env.mk
include makes/docker.mk
include makes/local.mk
include cmd/retry/Makefile


.PHONY: code-quality-check
code-quality-check: ARGS = \
	--exclude=".*_test\.go:.*error return value not checked.*\(errcheck\)$$" \
	--exclude="duplicate of.*_test.go.*\(dupl\)$$" \
	--vendor --deadline=1m ./... | sort
code-quality-check: docker-tool-gometalinter

.PHONY: code-quality-report
code-quality-report:
	time make code-quality-check | tail +7 | tee report.out
