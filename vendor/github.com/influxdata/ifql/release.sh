#!/bin/bash

# Exit if any command fails
set -e

# Get dir of script and make it is our working directory.
DIR=$(cd $(dirname "${BASH_SOURCE[0]}") && pwd)
cd $DIR

rm -f ./bin/*

# Build image
imagename="ifql-img"
dataname="ifql-data"

docker build -f Dockerfile_build -t $imagename .

# Create docker volume of repo
docker rm $dataname 2>/dev/null >/dev/null || true
docker create \
    --name $dataname \
    -v "/root/go/src/github.com/influxdata/ifqld" \
    $imagename /bin/true
docker cp "$DIR/" "$dataname:/root/go/src/github.com/influxdata/"

# Run tests in docker
docker run \
    --rm \
    --volumes-from $dataname \
    -e "GITHUB_TOKEN=${GITHUB_TOKEN}" \
    "$imagename" \
    make dist

docker cp "$dataname:/root/go/src/github.com/influxdata/ifql/dist" .
docker rm $dataname

make release-docker
