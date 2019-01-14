ifndef CID
$(error Please include env.mk before)
endif

DOCKER_VERSION := $(shell docker version | grep Version | head -1 | awk '{print $$2}')

OPEN_BROWSER       ?= true
SUPPORTED_VERSIONS ?= 1.7 1.8 latest

include $(CID)/docker/alpine.mk
include $(CID)/docker/base.mk
include $(CID)/docker/clean.mk
include $(CID)/docker/tools.mk
include $(CID)/docker/experimental-tools.mk

.PHONY: docker-pull
define docker_pull_tpl
docker-pull: docker-pull-$(1)
endef
docker-pull: docker-pull-tools
docker-pull: PRUNE = --force
docker-pull: docker-clean

render_docker_pull_tpl = $(eval $(call docker_pull_tpl,$(version)))
$(foreach version,$(SUPPORTED_VERSIONS),$(render_docker_pull_tpl))
