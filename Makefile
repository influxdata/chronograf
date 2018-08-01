.PHONY: assets dep clean test gotest gotestrace jstest run run-dev ctags

VERSION = 1.7.0
COMMIT ?= $(shell git rev-parse --short=8 HEAD)
GOBINDATA := $(shell go list -f {{.Root}}  github.com/kevinburke/go-bindata 2> /dev/null)
YARN := $(shell command -v yarn 2> /dev/null)

SOURCES := $(shell find . -name '*.go' ! -name '*_gen.go' -not -path "./vendor/*" )
UISOURCES := $(shell find ui -type f -not \( -path ui/build/\* -o -path ui/node_modules/\* -prune \) )

unexport LDFLAGS
LDFLAGS=-ldflags "-s -X main.version=${VERSION} -X main.commit=${COMMIT}"
BINARY=chronograf
CTLBINARY=chronoctl

.DEFAULT_GOAL := all

all: dep build

build: assets ${BINARY}

${BINARY}: $(SOURCES) .bindata .jsdep .godep
	go build -o ${BINARY} ${LDFLAGS} ./cmd/chronograf/main.go
	go build -o ${CTLBINARY} ${LDFLAGS} ./cmd/chronoctl

define CHRONOGIRAFFE
             ._ o o
             \_`-)|_
          ,""      _\_
        ,"  ## |   0 0.
      ," ##   ,-\__    `.
    ,"       /     `--._;) - "HAI, I'm Chronogiraffe. Let's be friends!"
  ,"     ## /
,"   ##    /
endef
export CHRONOGIRAFFE
chronogiraffe: ${BINARY}
	@echo "$$CHRONOGIRAFFE"

docker-${BINARY}: $(SOURCES)
	CGO_ENABLED=0 GOOS=linux go build -installsuffix cgo -o ${BINARY} ${LDFLAGS} \
		./cmd/chronograf/main.go

docker: dep assets docker-${BINARY}
	docker build -t chronograf .

assets: .jssrc .bindata

.bindata: server/swagger_gen.go canned/bin_gen.go dist/dist_gen.go
	@touch .bindata

dist/dist_gen.go: $(UISOURCES)
	go generate -x ./dist

server/swagger_gen.go: server/swagger.json
	go generate -x ./server

canned/bin_gen.go: canned/*.json
	go generate -x ./canned

.jssrc: $(UISOURCES)
	cd ui && yarn run clean && yarn run build
	@touch .jssrc

dep: .jsdep .godep

.godep:
ifndef GOBINDATA
	@echo "Installing go-bindata"
	go get -u github.com/kevinburke/go-bindata/...
endif
	@touch .godep

.jsdep: ui/yarn.lock
ifndef YARN
	$(error Please install yarn 0.19.1+)
else
	cd ui && yarn --no-progress --no-emoji
	@touch .jsdep
endif

gen: internal.pb.go

internal.pb.go: bolt/internal/internal.proto
	go generate -x ./bolt/internal

test: jstest gotest gotestrace lint-ci

gotest:
	go test -timeout 10s ./...

gotestrace:
	go test -race ./...

jstest:
	cd ui && yarn test --runInBand

lint:
	cd ui && yarn run lint

lint-ci:
	cd ui && yarn run eslint && yarn run tslint && yarn run tsc # fail fast for ci process

run: ${BINARY}
	./chronograf

run-dev: chronogiraffe
	./chronograf -d --log-level=debug

clean:
	if [ -f ${BINARY} ] ; then rm ${BINARY} ; fi
	cd ui && yarn run clean
	cd ui && rm -rf node_modules
	rm -f dist/dist_gen.go canned/bin_gen.go server/swagger_gen.go
	@rm -f .godep .jsdep .jssrc .bindata

ctags:
	ctags -R --languages="Go" --exclude=.git --exclude=ui .
