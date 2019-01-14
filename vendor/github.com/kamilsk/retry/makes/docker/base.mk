COMPLEX_BENCH_ARGS                ?= -benchmem
COMPLEX_TESTS_ARGS                ?= -timeout=1s
COMPLEX_TESTS_WITH_COVERAGE_ARGS  ?= $(COMPLEX_TESTS_ARGS)
PARALLEL_BENCH_ARGS               ?= $(COMPLEX_BENCH_ARGS)
PARALLEL_TESTS_ARGS               ?= $(COMPLEX_TESTS_ARGS)
PARALLEL_TESTS_WITH_COVERAGE_ARGS ?= $(COMPLEX_TESTS_WITH_COVERAGE_ARGS)

define docker_base_tpl

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
	           /bin/sh -c '$$(PACKAGES) | xargs go get -d -t && \
	                       $$(PACKAGES) | xargs go test -bench=. $$(strip $$(ARGS))'


.PHONY: docker-test-$(1)
docker-test-$(1):
	docker run --rm \
	           -v '$${GOPATH}/src/$${GO_PACKAGE}':'/go/src/$${GO_PACKAGE}' \
	           -w '/go/src/$${GO_PACKAGE}' \
	           -e GO15VENDOREXPERIMENT=1 \
	           golang:$(1) \
	           /bin/sh -c '$$(PACKAGES) | xargs go get -d -t && \
	                       $$(PACKAGES) | xargs go test -race $$(strip $$(ARGS))'

.PHONY: docker-test-check-$(1)
docker-test-check-$(1):
	docker run --rm \
	           -v '$${GOPATH}/src/$${GO_PACKAGE}':'/go/src/$${GO_PACKAGE}' \
	           -w '/go/src/$${GO_PACKAGE}' \
	           -e GO15VENDOREXPERIMENT=1 \
	           golang:$(1) \
	           /bin/sh -c '$$(PACKAGES) | xargs go get -d -t && \
	                       $$(PACKAGES) | xargs go test -run=^hack $$(strip $$(ARGS))'

.PHONY: docker-test-with-coverage-$(1)
docker-test-with-coverage-$(1):
	docker run --rm \
	           -v '$${GOPATH}/src/$${GO_PACKAGE}':'/go/src/$${GO_PACKAGE}' \
	           -w '/go/src/$${GO_PACKAGE}' \
	           -e GO15VENDOREXPERIMENT=1 \
	           golang:$(1) \
	           /bin/sh -c '$$(PACKAGES) | xargs go get -d -t; \
	                       echo "mode: $${GO_TEST_COVERAGE_MODE}" > '$$@.out'; \
	                       for package in $$$$($$(PACKAGES)); do \
	                           go test -covermode '$${GO_TEST_COVERAGE_MODE}' \
	                                   -coverprofile "coverage_$$$${package##*/}.out" \
	                                   $$(strip $$(ARGS)) "$$$${package}"; \
	                           if [ -f "coverage_$$$${package##*/}.out" ]; then \
	                               sed '1d' "coverage_$$$${package##*/}.out" >> '$$@.out'; \
	                               rm "coverage_$$$${package##*/}.out"; \
	                           fi \
	                       done'
	if [ ! -z '$${OPEN_BROWSER}' ]; then go tool cover -html='$$@.out'; fi


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

render_docker_base_tpl = $(eval $(call docker_base_tpl,$(version)))
$(foreach version,$(SUPPORTED_VERSIONS),$(render_docker_base_tpl))

.PHONY: complex-bench
complex-bench: ARGS = $(COMPLEX_BENCH_ARGS)
define complex_bench_tpl
complex-bench: docker-bench-$(1)
endef

render_complex_bench_tpl = $(eval $(call complex_bench_tpl,$(version)))
$(foreach version,$(SUPPORTED_VERSIONS),$(render_complex_bench_tpl))

.PHONY: complex-tests
complex-tests: ARGS = $(COMPLEX_TESTS_ARGS)
define complex_tests_tpl
complex-tests: docker-test-$(1)
endef

render_complex_tests_tpl = $(eval $(call complex_tests_tpl,$(version)))
$(foreach version,$(SUPPORTED_VERSIONS),$(render_complex_tests_tpl))

.PHONY: complex-tests-with-coverage
complex-tests-with-coverage: ARGS = $(COMPLEX_TESTS_WITH_COVERAGE_ARGS)
define complex_tests_with_coverage_tpl
complex-tests-with-coverage: docker-test-with-coverage-$(1)
endef

render_complex_tests_with_coverage_tpl = $(eval $(call complex_tests_with_coverage_tpl,$(version)))
$(foreach version,$(SUPPORTED_VERSIONS),$(render_complex_tests_with_coverage_tpl))

.PHONY: parallel-bench
parallel-bench: ARGS = $(PARALLEL_BENCH_ARGS)
parallel-bench:
	semaphore create
	for v in $(SUPPORTED_VERSIONS); do \
	    semaphore add -- make docker-bench-$$v ARGS=$(ARGS); \
	done
	semaphore wait

.PHONY: parallel-tests
parallel-tests: ARGS = $(PARALLEL_TESTS_ARGS)
parallel-tests:
	semaphore create
	for v in $(SUPPORTED_VERSIONS); do \
	    semaphore add -- make docker-test-$$v ARGS=$(ARGS); \
	done
	semaphore wait

.PHONY: parallel-tests-with-coverage
parallel-tests-with-coverage: ARGS = $(PARALLEL_TESTS_WITH_COVERAGE_ARGS)
parallel-tests-with-coverage:
	semaphore create
	for v in $(SUPPORTED_VERSIONS); do \
	    semaphore add -- make docker-test-with-coverage-$$v ARGS=$(ARGS); \
	done
	semaphore wait
