.PHONY: cmd-install
cmd-install:
	if ! [ -e main.go ]; then go install ./cmd/retry; else go install .; fi



.PHONY: cmd-test-1
cmd-test-1:
	docker run --rm \
	           -v '${GOPATH}/src/${GO_PACKAGE}':'/go/src/${GO_PACKAGE}' \
	           -w '/go/src/${GO_PACKAGE}' \
	           -e GO15VENDOREXPERIMENT=1 \
	           golang:1.5 \
	           /bin/sh -c 'go install ./cmd/retry \
	                       && retry -limit=3 -backoff=lin:500ms --notify -- /bin/sh -c "echo 'trying...'; exit 1"'

.PHONY: cmd-test-2
cmd-test-2:
	docker run --rm -it \
	           -v '${GOPATH}/src/${GO_PACKAGE}':'/go/src/${GO_PACKAGE}' \
	           -w '/go/src/${GO_PACKAGE}' \
	           -e GO15VENDOREXPERIMENT=1 \
	           golang:1.5 \
	           /bin/sh -c 'go install ./cmd/retry \
	                       && retry -h \
	                       && retry --help'

.PHONY: cmd-test-3
cmd-test-3:
	docker run --rm -it \
	           -v '${GOPATH}/src/${GO_PACKAGE}':'/go/src/${GO_PACKAGE}' \
	           -w '/go/src/${GO_PACKAGE}' \
	           -e GO15VENDOREXPERIMENT=1 \
	           golang:1.5 \
	           /bin/sh -c 'go install ./cmd/retry; \
	                       retry --debug -limit=/bad'



.PHONY: cmd-test-1-local
cmd-test-1-local: cmd-install
cmd-test-1-local:
	'${GOPATH}'/bin/retry -limit=3 -backoff=lin:500ms -- /bin/sh -c "echo 'trying...'; exit 1"

.PHONY: cmd-test-2-local
cmd-test-2-local: cmd-install
cmd-test-2-local:
	'${GOPATH}'/bin/retry -h
	'${GOPATH}'/bin/retry --help

.PHONY: cmd-test-3-local
cmd-test-3-local: cmd-install
cmd-test-3-local:
	'${GOPATH}'/bin/retry --debug -limit=/bad
