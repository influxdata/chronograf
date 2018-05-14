FILES:=$(wildcard out/*.go)

.PHONY: check
check: errcheck golint $(FILES:.go=.checked)

out/%.checked: out/%.go
	errcheck $<
	go vet --all $<
	go vet --shadow $<
	golint $<

$(GOPATH)/bin/go-bindata: $(wildcard ../*.go) $(wildcard ../**/*.go)
	go install -race ../...

out/compress-memcopy.go: $(wildcard in/**/*) $(GOPATH)/bin/go-bindata
	GO_BINDATA_TEST=true $(GOPATH)/bin/go-bindata --modtime=1136214245 -o $@ in/...

out/compress-nomemcopy.go: $(wildcard in/**/*) $(GOPATH)/bin/go-bindata
	GO_BINDATA_TEST=true $(GOPATH)/bin/go-bindata --modtime=1136214245 --nomemcopy -o $@ in/...

out/debug.go: $(wildcard in/**/*) $(GOPATH)/bin/go-bindata
	GO_BINDATA_TEST=true $(GOPATH)/bin/go-bindata --modtime=1136214245 --debug -o $@ in/...

out/nocompress-memcopy.go: $(wildcard in/**/*) $(GOPATH)/bin/go-bindata
	GO_BINDATA_TEST=true $(GOPATH)/bin/go-bindata --modtime=1136214245 --nocompress -o $@ in/...

out/nocompress-nomemcopy.go: $(wildcard in/**/*) $(GOPATH)/bin/go-bindata
	GO_BINDATA_TEST=true $(GOPATH)/bin/go-bindata --modtime=1136214245 --nocompress -nomemcopy -o $@ in/...

errcheck:
	go get github.com/kisielk/errcheck

golint:
	go get github.com/golang/lint/golint
