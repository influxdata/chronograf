.PHONY: docker-in-tools
docker-in-tools:              #| Mounts go package directory and runs go-tools container in interactive mode.
                              #| Uses: GITHUB_TOKEN, GOPATH, GO_PACKAGE.
	docker run --rm -it \
	           -e GITHUB_TOKEN='${GITHUB_TOKEN}' \
	           -v '${GOPATH}/src/${GO_PACKAGE}':'/go/src/${GO_PACKAGE}' \
	           -w '/go/src/${GO_PACKAGE}' \
	           kamilsk/go-tools:latest \
	           /bin/sh

.PHONY: docker-pull-tools
docker-pull-tools:            #| Pull kamilsk/go-tools docker image.
	docker pull kamilsk/go-tools:latest

.PHONY: docker-tool-easyjson
docker-tool-easyjson:         #| Mounts go package directory and executes `easyjson` command.
                              #| Accepts: ARGS.
                              #| Uses: GOPATH, GO_PACKAGE.
	docker run --rm \
	           -v '${GOPATH}/src/${GO_PACKAGE}':'/go/src/${GO_PACKAGE}' \
	           -w '/go/src/${GO_PACKAGE}' \
	           kamilsk/go-tools:latest \
	           easyjson $(strip $(ARGS))

.PHONY: docker-tool-glide
docker-tool-glide:            #| Mounts go package directory and executes `glide` command.
                              #| Accepts: COMMAND, ARGS.
                              #| Uses: GOPATH, GO_PACKAGE.
	docker run --rm \
	           -v '${GOPATH}/src/${GO_PACKAGE}':'/go/src/${GO_PACKAGE}' \
	           -w '/go/src/${GO_PACKAGE}' \
	           kamilsk/go-tools:latest \
	           glide $(COMMAND) $(strip $(ARGS))

.PHONY: docker-tool-gometalinter
docker-tool-gometalinter:     #| Mounts go package direcotry and executes `gometalinter` command.
                              #| Accepts: ARGS.
                              #| Uses: GOPATH, GO_PACKAGE, PACKAGES.
	docker run --rm \
	           -v '${GOPATH}/src/${GO_PACKAGE}':'/go/src/${GO_PACKAGE}' \
	           -w '/go/src/${GO_PACKAGE}' \
	           kamilsk/go-tools:latest \
	           /bin/sh -c '$(PACKAGES) | xargs go test -i && \
	                       gometalinter $(strip $(ARGS))'

.PHONY: docker-tool-goreleaser
docker-tool-goreleaser:       #| Mounts go package directory and executes `goreleaser` command.
                              #| Accepts: ARGS.
                              #| Uses: GITHUB_TOKEN, GOPATH, GO_PACKAGE.
	docker run --rm \
	           -e GITHUB_TOKEN='${GITHUB_TOKEN}' \
	           -v '${GOPATH}/src/${GO_PACKAGE}':'/go/src/${GO_PACKAGE}' \
	           -w '/go/src/${GO_PACKAGE}' \
	           kamilsk/go-tools:latest \
	           goreleaser $(strip $(ARGS))
