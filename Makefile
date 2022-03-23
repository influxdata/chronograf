ifeq ($(OS), Windows_NT)
	VERSION := $(shell git describe --exact-match --tags 2>nil)
	GOBINDATA := $(shell go-bindata.exe --version 2>nil)
else
	VERSION := $(shell git describe --exact-match --tags 2>/dev/null)
	GOBINDATA := $(shell which go-bindata 2> /dev/null)
endif

COMMIT ?= $(shell git rev-parse --short=8 HEAD)
YARN := $(shell command -v yarn 2> /dev/null)

SOURCES := $(shell find . -name '*.go' ! -name '*_gen.go' -not -path "./vendor/*" )
UISOURCES := $(shell find ui -type f -not \( -path ui/build/\* -o -path ui/node_modules/\* -o -path ui/cypress/\* -prune \) )

unexport LDFLAGS
ifdef VERSION
	TMP_BUILD_VERSION = -X main.version=$(VERSION)
endif
LDFLAGS=-ldflags "-s -X main.commit=${COMMIT} ${TMP_BUILD_VERSION}"
unexport TMP_BUILD_VERSION

BINARY=chronograf
CTLBINARY=chronoctl
GO111MODULE=on

.DEFAULT_GOAL := all

.PHONY: assets dep clean test gotest gotestrace jstest run run-dev ctags

all: dep build

build: assets ${BINARY}

${BINARY}: $(SOURCES) .bindata .jsdep .godep
	GO111MODULE=on go build -o ${BINARY} ${LDFLAGS} ./cmd/chronograf/main.go
	GO111MODULE=on go build -o ${CTLBINARY} ${LDFLAGS} ./cmd/chronoctl

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
	CGO_ENABLED=0 GOOS=linux GO111MODULE=on go build -installsuffix cgo -o ${BINARY} ${LDFLAGS} \
		./cmd/chronograf/main.go

docker: dep assets docker-${BINARY}
	docker build -t chronograf .

assets: .jssrc .bindata

.bindata: server/swagger_gen.go canned/bin_gen.go protoboards/bin_gen.go dist/dist_gen.go
	@touch .bindata

dist/dist_gen.go: $(UISOURCES)
	go generate -x ./dist

server/swagger_gen.go: server/swagger.json
	go generate -x ./server

canned/bin_gen.go: canned/*.json
	go generate -x ./canned

protoboards/bin_gen.go: protoboards/*.json
	go generate -x ./protoboards

.jssrc: $(UISOURCES)
	cd ui && yarn run clean && yarn run build
	@touch .jssrc

dep: .jsdep .godep

.godep:
ifndef GOBINDATA
	@echo "Installing go-bindata"
	go install github.com/kevinburke/go-bindata/...@v3.22.0+incompatible
	GO111MODULE=on go get
endif
	@touch .godep

.jsdep: ./yarn.lock
ifndef YARN
	$(error Please install yarn 1.19.1+)
else
	cd ui && yarn --no-progress --no-emoji
	@touch .jsdep
endif

gen: internal.pb.go

internal.pb.go: kv/internal/internal.proto
	GO111MODULE=on go generate -x ./kv/internal

test: jstest gotest gotestrace lint-ci

gotest:
	GO111MODULE=on go test -timeout 10s ./...

gotestrace:
	GO111MODULE=on go test -race ./...

jstest:
	cd ui && yarn test --runInBand

lint:
	cd ui && yarn run lint

lint-ci:
	cd ui && yarn run eslint && yarn run tsc # fail fast for ci process

run: ${BINARY}
	./chronograf

run-dev: chronogiraffe
	mkdir -p ui/build
	./chronograf -d --log-level=debug

e2e-prepare:
	./ui/cypress/local-chronograf-influxdb-enterprise.sh

e2e:
	cd ui && yarn test:e2e

clean:
	if [ -f ${BINARY} ] ; then rm ${BINARY} ; fi
	cd ui && yarn run clean
	cd ui && rm -rf node_modules
	rm -f dist/dist_gen.go canned/bin_gen.go protoboards/bin_gen.go server/swagger_gen.go
	@rm -f .godep .jsdep .jssrc .bindata
	./ui/cypress/local-chronograf-influxdb-enterprise.sh 0 1

ctags:
	ctags -R --languages="Go" --exclude=.git --exclude=ui .
