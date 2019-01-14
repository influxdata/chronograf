ifndef PACKAGES
$(error Please include env.mk before)
endif

OPEN_BROWSER              ?= true
GO_TEST_COVERAGE_MODE     ?= count
GO_TEST_COVERAGE_FILENAME ?= cover.out


.PHONY: install-deps
install-deps:                 #| Executes `go get -d -t`.
                              #| Uses: PACKAGES.
	$(PACKAGES) | xargs go get -d -t

.PHONY: update-deps
update-deps:                  #| Executes `go get -d -t -u`.
                              #| Uses: PACKAGES.
	$(PACKAGES) | xargs go get -d -t -u


.PHONY: build
build:                        #| Executes `go build`.
                              #| Accepts: ARGS.
                              #| Uses: PACKAGES.
	$(PACKAGES) | xargs go build -v $(strip $(ARGS))

.PHONY: clean
clean:                        #| Executes `go clean -i`.
                              #| Uses: PACKAGES.
	$(PACKAGES) | xargs go clean -i -x

.PHONY: install
install:                      #| Executes `go install`.
                              #| Uses: PACKAGES.
	$(PACKAGES) | xargs go install

.PHONY: vet
vet:                          #| Executes `go vet`.
                              #| Uses: PACKAGES.
	$(PACKAGES) | xargs go vet


.PHONY: bench
bench:                        #| Runs all benchmark tests.
                              #| Accepts: ARGS.
                              #| Uses: PACKAGES.
	$(PACKAGES) | xargs go test -bench=. $(strip $(ARGS))


.PHONY: test
test:                         #| Runs tests with race.
                              #| Accepts: ARGS.
                              #| Uses: PACKAGES.
	$(PACKAGES) | xargs go test -race $(strip $(ARGS))

.PHONY: test-check
test-check:                   #| Fast runs tests to check their compilation errors.
                              #| Accepts: ARGS.
                              #| Uses: PACKAGES.
	$(PACKAGES) | xargs go test -run=^hack $(strip $(ARGS))

.PHONY: test-with-coverage
test-with-coverage:           #| Runs tests with coverage.
                              #| Accepts: ARGS.
                              #| Uses: PACKAGES.
	$(PACKAGES) | xargs go test -cover $(strip $(ARGS))

.PHONY: test-with-coverage-formatted
test-with-coverage-formatted: #| Runs tests with coverage and formats the result.
                              #| Accepts: ARGS.
                              #| Uses: PACKAGES.
	$(PACKAGES) | xargs go test -cover $(strip $(ARGS)) | column -t | sort -r

.PHONY: test-with-coverage-profile
test-with-coverage-profile:   #| Runs tests with coverage and collects the result.
                              #| Accepts: ARGS, OPEN_BROWSER.
                              #| Uses: GO_TEST_COVERAGE_MODE, GO_TEST_COVERAGE_FILENAME, PACKAGES.
	echo 'mode: ${GO_TEST_COVERAGE_MODE}' > '${GO_TEST_COVERAGE_FILENAME}'
	for package in $$($(PACKAGES)); do \
	    go test -covermode '${GO_TEST_COVERAGE_MODE}' \
	            -coverprofile "coverage_$${package##*/}.out" \
	            $(strip $(ARGS)) "$${package}"; \
	    if [ -f "coverage_$${package##*/}.out" ]; then \
	        sed '1d' "coverage_$${package##*/}.out" >> '${GO_TEST_COVERAGE_FILENAME}'; \
	        rm "coverage_$${package##*/}.out"; \
	    fi \
	done
	if [ ! -z '${OPEN_BROWSER}' ]; then go tool cover -html='${GO_TEST_COVERAGE_FILENAME}'; fi

.PHONY: test-example
test-example: GO_TEST_COVERAGE_FILENAME = coverage_example.out
test-example:                 #| Runs example tests with coverage and collects the result.
                              #| Accepts: ARGS, OPEN_BROWSER.
                              #| Uses: GO_TEST_COVERAGE_MODE, GO_TEST_COVERAGE_FILENAME, PACKAGES.
	echo 'mode: ${GO_TEST_COVERAGE_MODE}' > '${GO_TEST_COVERAGE_FILENAME}'
	for package in $$($(PACKAGES)); do \
	    go test -v -run=Example \
	            -covermode '${GO_TEST_COVERAGE_MODE}' \
	            -coverprofile "coverage_example_$${package##*/}.out" \
	            $(strip $(ARGS)) "$${package}"; \
	    if [ -f "coverage_$${package##*/}.out" ]; then \
	        sed '1d' "coverage_example_$${package##*/}.out" >> '${GO_TEST_COVERAGE_FILENAME}'; \
	        rm "coverage_example_$${package##*/}.out"; \
	    fi \
	done
	if [ ! -z '${OPEN_BROWSER}' ]; then go tool cover -html='${GO_TEST_COVERAGE_FILENAME}'; fi


.PHONY: docs
docs: WAITING = 2
docs:                         #| Starts local documetation server at :8080 port.
                              #| Accepts: WAITING.
                              #| Uses: GO_PACKAGE.
	godoc -play -http localhost:8080 &
	sleep $(WAITING)
	open http://localhost:8080/pkg/$(GO_PACKAGE)

.PHONY: docs-stop
docs-stop:                    #| Stops all local documentation servers.
	ps cax | grep godoc | awk '{print $$1}' | xargs kill
