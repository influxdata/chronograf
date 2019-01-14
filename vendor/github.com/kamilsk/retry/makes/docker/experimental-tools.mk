.PHONY: docker-in-experimental-tools
docker-in-experimental-tools:
	docker run --rm -it \
	           -e GITHUB_TOKEN='${GITHUB_TOKEN}' \
	           -v '${GOPATH}/src/${GO_PACKAGE}':'/go/src/${GO_PACKAGE}' \
	           -w '/go/src/${GO_PACKAGE}' \
	           kamilsk/go-tools:experimental \
	           /bin/sh

.PHONY: docker-pull-experimental-tools
docker-pull-experimental-tools:
	docker pull kamilsk/go-tools:experimental

.PHONY: docker-experimental-tool-depth
docker-experimental-tool-depth:
	docker run --rm \
	           -v '${GOPATH}/src/${GO_PACKAGE}':'/go/src/${GO_PACKAGE}' \
	           -w '/go/src/${GO_PACKAGE}' \
	           kamilsk/go-tools:experimental \
	           depth $(strip $(ARGS))

.PHONY: docker-experimental-tool-apicompat
docker-experimental-tool-apicompat:
	docker run --rm \
	           -v '${GOPATH}/src/${GO_PACKAGE}':'/go/src/${GO_PACKAGE}' \
	           -w '/go/src/${GO_PACKAGE}' \
	           kamilsk/go-tools:experimental \
	           apicompat $(strip $(ARGS))

.PHONY: docker-experimental-tool-benchcmp
docker-experimental-tool-benchcmp:
	docker run --rm \
	           -v '${GOPATH}/src/${GO_PACKAGE}':'/go/src/${GO_PACKAGE}' \
	           -w '/go/src/${GO_PACKAGE}' \
	           kamilsk/go-tools:experimental \
	           benchcmp $(strip $(ARGS))

.PHONY: docker-experimental-tool-godepq
docker-experimental-tool-godepq:
	docker run --rm \
	           -v '${GOPATH}/src/${GO_PACKAGE}':'/go/src/${GO_PACKAGE}' \
	           -w '/go/src/${GO_PACKAGE}' \
	           kamilsk/go-tools:experimental \
	           godepq $(strip $(ARGS))

.PHONY: docker-experimental-tool-goreporter
docker-experimental-tool-goreporter:
	docker run --rm \
	           -e GITHUB_TOKEN='${GITHUB_TOKEN}' \
	           -v '${GOPATH}/src/${GO_PACKAGE}':'/go/src/${GO_PACKAGE}' \
	           -w '/go/src/${GO_PACKAGE}' \
	           kamilsk/go-tools:experimental \
	           goreporter $(strip $(ARGS))

.PHONY: docker-experimental-tool-zb
docker-experimental-tool-zb:
	docker run --rm \
	           -v '${GOPATH}/src/${GO_PACKAGE}':'/go/src/${GO_PACKAGE}' \
	           -w '/go/src/${GO_PACKAGE}' \
	           kamilsk/go-tools:experimental \
	           zb $(COMMAND) $(strip $(ARGS))
