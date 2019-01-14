#!/bin/bash

DIR=$(cd $(dirname ${BASH_SOURCE[0]}) && pwd)
cd $DIR

set -e

export GO111MODULE=on

version=$(go run ./cmd/changelog nextver)
git tag -s -m "Release $version" $version
git push origin $version
go run github.com/goreleaser/goreleaser release --rm-dist --release-notes <(go run ./cmd/changelog generate --version $version --commit-url https://github.com/influxdata/flux/commit)
