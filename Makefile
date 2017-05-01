rwildcard := $(wildcard $1$2) $(foreach d,$(wildcard $1*),$(call rwildcard,$d/,$2))

.PHONY: assets dep clean test gotest gotestrace jstest run run-dev ctags continuous

GO_SOURCES := $(call rwildcard,./,*.go)
GO_GENSOURCES := $(call rwildcard,./,*_gen.go)
SOURCES := $(filter-out $(GO_GENSOURCES),$(GO_SOURCES))

UI_FILES := $(call rwildcard,./ui,*)
BUILD_FILES := $(call rwildcard,./ui/build,*)
PACKAGE_FILES := $(call rwildcard,./ui/node_modules,*)

UISOURCES := $(filter-out $(PACKAGE_FILES), $(filter-out $(UI_FILES),$(PACKAGE_FILES)))

VERSION ?= $(shell git describe --always --tags)
COMMIT ?= $(shell git rev-parse --short=8 HEAD)
GDM := $(shell command -v gdm 2> /dev/null)
GOBINDATA := $(shell go list -f {{.Root}}  github.com/jteeuwen/go-bindata 2> /dev/null)
YARN := $(shell yarn --version)

# SOURCES := $(shell find . -name '*.go' ! -name '*_gen.go')
# UISOURCES := $(shell find ui -type f -not \( -path ui/build/\* -o -path ui/node_modules/\* -prune \) )

LDFLAGS=-ldflags "-s -X main.version=${VERSION} -X main.commit=${COMMIT}"
BINARY=chronograf

.DEFAULT_GOAL := all

all: dep build

build: assets ${BINARY}

dev: dep dev-assets ${BINARY}

${BINARY}: $(SOURCES) .bindata .jsdep .godep
	go build -o ${BINARY} ${LDFLAGS} ./cmd/chronograf/main.go

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

dev-assets: .dev-jssrc .bindata

.bindata: server/swagger_gen.go canned/bin_gen.go dist/dist_gen.go
	@echo $null >> .bindata

dist/dist_gen.go: $(UISOURCES)
	go generate -x ./dist

server/swagger_gen.go: server/swagger.json
	go generate -x ./server

canned/bin_gen.go: canned/*.json
	go generate -x ./canned

.jssrc: $(UISOURCES)
	cd ui && npm run build
	@echo $null >> .jssrc

.dev-jssrc: $(UISOURCES)
	cd ui && npm run build:dev
	@echo $null >> .dev-jssrc

dep: .jsdep .godep

.godep: Godeps
ifndef GDM
	@echo "Installing GDM"
	go get github.com/sparrc/gdm
endif
ifndef GOBINDATA
	@echo "Installing go-bindata"
	go get -u github.com/jteeuwen/go-bindata/...
endif
	gdm restore
	@echo $null >> .godep

.jsdep: ui/yarn.lock
ifndef YARN
	$(error Please install yarn 0.19.1+)
else
	cd ui && yarn --no-progress --no-emoji
	@echo $null >> .jsdep
endif

gen: bolt/internal/internal.proto
	go generate -x ./bolt/internal

test: jstest gotest gotestrace

gotest:
	go test ./...

gotestrace:
	go test -race ./...

jstest:
	cd ui && npm test

run: ${BINARY}
	./chronograf

run-dev: chronogiraffe
	./chronograf -d --log-level=debug

clean:
	if [ -f ${BINARY} ] ; then rm ${BINARY} ; fi
	cd ui && npm run clean
	cd ui && rm -rf node_modules
	rm -f dist/dist_gen.go canned/bin_gen.go server/swagger_gen.go
	@rm -f .godep .jsdep .jssrc .dev-jssrc .bindata

continuous:
	while true; do if fswatch -e "\.git" -r --one-event .; then echo "#-> Starting build: `date`"; make dev; pkill -9 chronograf; make run-dev & echo "#-> Build complete."; fi; sleep 0.5; done

ctags:
	ctags -R --languages="Go" --exclude=.git --exclude=ui .
