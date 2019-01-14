define docker_alpine_tpl

.PHONY: docker-pull-$(1)
docker-pull-$(1):
	docker pull golang:$(1)

.PHONY: docker-in-$(1)
docker-in-$(1):
	docker run --rm -it \
	           -v '$${GOPATH}/src/$${GO_PACKAGE}':'/go/src/$${GO_PACKAGE}' \
	           -w '/go/src/$${GO_PACKAGE}' \
	           -e GO15VENDOREXPERIMENT=1 \
	           golang:$(1) \
	           /bin/sh


.PHONY: docker-bench-$(1)
docker-bench-$(1):
	docker run --rm \
	           -v '$${GOPATH}/src/$${GO_PACKAGE}':'/go/src/$${GO_PACKAGE}' \
	           -w '/go/src/$${GO_PACKAGE}' \
	           -e GO15VENDOREXPERIMENT=1 \
	           golang:$(1) \
	           /bin/sh -c '$$(PACKAGES) | xargs go test -bench=. $$(strip $$(ARGS))'


.PHONY: docker-test-$(1)
docker-test-$(1):
	docker run --rm \
	           -v '$${GOPATH}/src/$${GO_PACKAGE}':'/go/src/$${GO_PACKAGE}' \
	           -w '/go/src/$${GO_PACKAGE}' \
	           -e GO15VENDOREXPERIMENT=1 \
	           golang:$(1) \
	           /bin/sh -c '$$(PACKAGES) | xargs go test $$(strip $$(ARGS))'

.PHONY: docker-test-check-$(1)
docker-test-check-$(1):
	docker run --rm \
	           -v '$${GOPATH}/src/$${GO_PACKAGE}':'/go/src/$${GO_PACKAGE}' \
	           -w '/go/src/$${GO_PACKAGE}' \
	           -e GO15VENDOREXPERIMENT=1 \
	           golang:$(1) \
	           /bin/sh -c '$$(PACKAGES) | xargs go test -run=^hack $$(strip $$(ARGS))'


.PHONY: docker-docs-$(1)
docker-docs-$(1):
	docker run -d --rm \
	           -v '$${GOPATH}/src/$${GO_PACKAGE}':'/go/src/$${GO_PACKAGE}' \
	           -w '/go/src/$${GO_PACKAGE}' \
	           -p 127.0.0.1:8080:8080 \
	           -e GO15VENDOREXPERIMENT=1 \
	           golang:$(1) \
	           godoc -play -http :8080
	sleep 2
	open http://localhost:8080/pkg/$$(GO_PACKAGE)

.PHONY: docker-docs-$(1)-stop
docker-docs-$(1)-stop:
	docker ps | grep 'golang:$(1)' | grep godoc | awk '{print $$$$1}' | xargs docker stop

endef

render_docker_alpine_tpl = $(if $(filter $(version),latest), \
    $(eval $(call docker_alpine_tpl,alpine)), \
    $(eval $(call docker_alpine_tpl,$(version)-alpine)) \
)
$(foreach version,$(SUPPORTED_VERSIONS),$(render_docker_alpine_tpl))
