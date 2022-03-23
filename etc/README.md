# Builds

Builds are run from a docker build image that is configured with the node and go we support.
Our circle.yml uses this docker container to build, test and create release packages.

## Updating new node/go versions

### Step 1: Build New Docker Image and Save It to Quay

Having logged to quay.io with push permissions run:

```sh
cd $CHRONOGRAF_REPOSITORY_ROOT
./etc/scripts/docker/build.sh
```

### OPTIONAL Step 2: Check the build image

Run the image with:

```sh
export DOCKER_TAG="chronograf-$(date +%Y%m%d)"
./etc/scripts/docker/run.sh
```

### Step 3: Update script and circle

1. Check default tag in `etc/docker/run.sh`, replace with new one.
2. Check DOCKER_TAG in .circleci/config.yml to the new container.
