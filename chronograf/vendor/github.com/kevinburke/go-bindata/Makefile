DIFFER := $(GOPATH)/bin/differ
MEGACHECK := $(GOPATH)/bin/megacheck
RELEASE := $(GOPATH)/bin/github-release
WRITE_MAILMAP := $(GOPATH)/bin/write_mailmap

all:
	$(MAKE) -C testdata

$(DIFFER):
	go get -u github.com/kevinburke/differ

diff-testdata: | $(DIFFER)
	$(DIFFER) $(MAKE) -C testdata
	$(DIFFER) go fmt ./testdata/out/...

$(MEGACHECK):
	go get honnef.co/go/tools/cmd/megacheck

lint: | $(MEGACHECK)
	go vet ./...
	$(MEGACHECK) ./...

go-test:
	go test ./...

go-race-test:
	go test -race ./...

test: go-test
	$(MAKE) -C testdata

race-test: lint go-race-test
	$(MAKE) -C testdata

$(WRITE_MAILMAP):
	go get -u github.com/kevinburke/write_mailmap

force: ;

AUTHORS.txt: force | $(WRITE_MAILMAP)
	$(WRITE_MAILMAP) > AUTHORS.txt

authors: AUTHORS.txt

ci: go-race-test diff-testdata

release: | $(RELEASE) race-test diff-testdata
ifndef version
	@echo "Please provide a version"
	exit 1
endif
ifndef GITHUB_TOKEN
	@echo "Please set GITHUB_TOKEN in the environment"
	exit 1
endif
	mkdir -p releases/$(version)
	GOOS=linux GOARCH=amd64 go build -o releases/$(version)/go-bindata-linux-amd64 ./go-bindata
	GOOS=darwin GOARCH=amd64 go build -o releases/$(version)/go-bindata-darwin-amd64 ./go-bindata
	GOOS=windows GOARCH=amd64 go build -o releases/$(version)/go-bindata-windows-amd64 ./go-bindata
	# these commands are not idempotent so ignore failures if an upload repeats
	$(RELEASE) release --user kevinburke --repo go-bindata --tag $(version) || true
	$(RELEASE) upload --user kevinburke --repo go-bindata --tag $(version) --name go-bindata-linux-amd64 --file releases/$(version)/go-bindata-linux-amd64 || true
	$(RELEASE) upload --user kevinburke --repo go-bindata --tag $(version) --name go-bindata-darwin-amd64 --file releases/$(version)/go-bindata-darwin-amd64 || true
	$(RELEASE) upload --user kevinburke --repo go-bindata --tag $(version) --name go-bindata-windows-amd64 --file releases/$(version)/go-bindata-windows-amd64 || true
