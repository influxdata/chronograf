# Updating the Builder Image

The image that performs CI builds is located at `etc/Dockerfile_build`. When this file is changed, a manual build and release process is required.

1. Build the image:

```
docker build . -t quay.io/influxdb/builder:chronograf-<YYYYMMDD>
```

2. Push the image to quay:

```
docker push quay.io/influxdb/builder:chronograf-<YYYYMMDD>
```

If you have any permissions issues, ping @jeffreyssmith2nd or @bnpfeife
