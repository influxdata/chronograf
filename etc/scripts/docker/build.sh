#!/bin/bash
set -x
DOCKER_TAG="chronograf-$(date +%Y%m%d)"

docker build --rm=false -f etc/Dockerfile_build -t builder:$DOCKER_TAG .
docker tag builder:$DOCKER_TAG quay.io/influxdb/builder:$DOCKER_TAG

docker push quay.io/influxdb/builder:$DOCKER_TAG
