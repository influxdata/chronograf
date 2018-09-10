#!/bin/bash

set -e

DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
cd "$DIR"

go run gen.go
go run main.go
g++ -o cpp.test main.cpp
./cpp.test 2>/dev/null
rm cpp.test

go run validate.go
