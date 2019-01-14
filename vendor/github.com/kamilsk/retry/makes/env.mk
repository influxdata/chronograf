ifndef GOPATH
$(error $$GOPATH not set)
endif

CWD        := $(patsubst %/,%,$(dir $(abspath $(firstword $(MAKEFILE_LIST)))))
CID        := $(patsubst %/,%,$(dir $(abspath $(lastword $(MAKEFILE_LIST)))))
DATE       := $(shell date -u "+%Y-%m-%d_%H:%M:%S")
GO_VERSION := $(shell go version | awk '{print $$3}' | tr -d 'go')

GIT_REV    := $(shell git rev-parse --short HEAD)
GO_PACKAGE := $(patsubst %/,%,$(subst $(GOPATH)/src/,,$(CWD)))
PACKAGES   := go list ./... | grep -v vendor | grep -v ^_

SHELL      ?= /bin/bash -euo pipefail

.PHONY: debug
debug:                        #| Prints debug information of Makefile.
	make -pnrR

.PHONY: help
help:                         #| Shows available help information of Makefile.
	@fgrep -h "#|" $(MAKEFILE_LIST) | fgrep -v fgrep | sed -e 's/\\$$//' | sed -e 's/#| //'

.PHONY: pull-makes
pull-makes:                   #| Clones branch makefile-go of git@github.com:kamilsk/shared.git into makes dir
	rm -rf makes
	git clone git@github.com:kamilsk/shared.git makes
	( \
	  cd makes && \
	  git checkout makefile-go && \
	  echo '- ' $$(cat README.md | head -n1 | awk '{print $$3}') 'at revision' $$(git rev-parse HEAD) \
	)
	rm -rf makes/.git makes/LICENSE makes/Makefile

.PHONY: pull-github-tpl
pull-github-tpl:              #| Clones branch github-tpl-go of git@github.com:kamilsk/shared.git into .github dir
	rm -rf .github
	git clone git@github.com:kamilsk/shared.git .github
	( \
	  cd .github && \
	  git checkout github-tpl-go && \
	  git branch -d master && \
	  echo '- ' $$(cat README.md | head -n1 | awk '{print $$3}') 'at revision' $$(git rev-parse HEAD) \
	)
	rm -rf .github/.git .github/LICENSE .github/README.md
