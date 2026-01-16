ifeq ($(OS), Windows_NT)
	VERSION := $(shell git describe --exact-match --tags 2>nil)
else
	VERSION := $(shell git describe --exact-match --tags 2>/dev/null)
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

.DEFAULT_GOAL := all

.PHONY: assets dep clean test gotest gotestrace jstest run run-dev ctags

all: dep build

build: assets ${BINARY}

${BINARY}: $(SOURCES) .bindata .jsdep .godep
	. $HOME/.cargo/env && CGO_ENABLED=1 go build -o ${BINARY} ${LDFLAGS} ./cmd/chronograf/main.go
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
	CGO_ENABLED=1 GOOS=linux go build -o ${BINARY} ${LDFLAGS} \
		./cmd/chronograf/main.go

docker: dep assets docker-${BINARY}
	docker build -t chronograf .

assets: .jssrc .bindata

.bindata: server/swagger.json canned/*.json protoboards/*.json $(UISOURCES)
	@touch .bindata

.jssrc: $(UISOURCES)
	cd ui && yarn run clean && yarn run build
	@touch .jssrc

dep: .jsdep .godep

.godep:
	go get
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
	go generate -x ./kv/internal

test: gochecktidy gocheckfmt jstest gotest gotestrace lint-ci

gochecktidy:
	go version
	go mod tidy
	if ! git --no-pager diff --exit-code -- go.mod go.sum; then\
		echo Modules are not tidy, please run \`go mod tidy\` ! ;\
		exit 1;\
	fi

gocheckfmt:
	NOFMTFILES=`go fmt './...'` ; \
	if [ ! -z "$$NOFMTFILES" ] ; then\
		echo Unformatted files: $$NOFMTFILES ;\
		echo Run \`go fmt ./...\` to fix it ! ;\
		exit 1;\
	fi

gotest:
	go test -timeout 10s ./...

gotestrace:
	go test -race ./...

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
	rm -rf node_modules
	cd ui && rm -rf node_modules
	@rm -f .godep .jsdep .jssrc .bindata

ctags:
	ctags -R --languages="Go" --exclude=.git --exclude=ui .
