## Creating a release
The release process is handled via our [circle.yml](https://github.com/influxdata/chronograf/blob/master/circle.yml).

A release tag of the format `1.3.0.0` needs to be added.  Afterwhich, circle
will build our packages for all of our platforms.

### Bumpversion
We use [bumpversion](https://github.com/peritus/bumpversion) to help us
remember all the places to increment our version number.

To install:

```sh
pip install --upgrade bumpversion
```

To use to increment third number (e.g. 1.3.1.0 -> 1.3.2.0):

```sh
bumpversion --allow-dirty   --new-version=1.3.2.0 patch
```


To increment minor number (e.g. 1.3.1.0 -> 1.4.0.0):

```sh
bumpversion --allow-dirty   --new-version=1.4.0.0 minor
```

The behavior of `bumpversion` is controlled by .bumpversion.cfg

### Creating Release tag
You can create a release tag from [Github](https://github.com/influxdata/chronograf/releases)
or create an annotated tag:

```sh
git tag -a 1.3.0.0 -m "Release 1.3.0.0"
git push --tags
```

### Release platforms
* Linux
    * amd64
    * i386
    * armhf
    * arm64
    * armel
    * static_i386
    * static_amd64
* OS X
    * amd64
* Windows
    * amd64

## Testing builds

The test builds are stored as artifacts on the CircleCI build page. If you want to create a test build, you can do it by triggering a pipeline on CircleCI.
During the trigger of the pipeline, you should specify the `trigger` parameter with the value `deploy-as-artifacts`:

<p align="left">
  <img src="./images/testing-builds-pipeline.png"/>
</p>

The resulting artifacts will be available on the CircleCI build page for `build-nightly` Job:

<p align="left">
  <img src="./images/testing-builds-result.png"/>
</p>