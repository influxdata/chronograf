#!/bin/bash

# Get dir of script and make it is our working directory.
DIR=$(cd $(dirname "${BASH_SOURCE[0]}") && pwd)
cd $DIR

# Build image
imagename="ifql-img-${CIRCLE_BUILD_NUM}"
dataname="ifql-data-${CIRCLE_BUILD_NUM}"

docker build -f Dockerfile_build -t $imagename .

# Create docker volume of repo

docker create \
    --name $dataname \
    -v "/root/go/src/github.com/influxdata/ifql" \
    $imagename /bin/true
docker cp "$DIR/" "$dataname:/root/go/src/github.com/influxdata/"

# Run tests in docker
docker run \
    --rm \
    --volumes-from $dataname \
    "$imagename" \
    make test
