#!/bin/bash

set -x

SRC=.

cd $SRC

TAG=$(git describe --always --tags --abbrev=0)
SHORTSHA=$(git log --pretty=format:'%h' -n 1)
SHA=$(git rev-parse HEAD)

BUILD_DIR=build
PKG_DIR="$BUILD_DIR/chronograf-$TAG-$SHORTSHA"
BINARY=chronograf

go_build ()
{
    go build -o $EXE -ldflags="-X main.version=$TAG -X main.commit=$SHA" $SRC/cmd/chronograf
}

go_build_static ()
{
    CGO_ENABLED=0 go build -o $EXE -ldflags="-s -X main.version=$TAG -X main.commit=$SHA" -a -installsuffix cgo $SRC/cmd/chronograf
}

set_exe ()
{
    INSTALL_DIR=$PKG_DIR/$GOOS/$GOARCH/bin
    EXE=$INSTALL_DIR/$BINARY
}

deb_package ()
{
    fpm -f \
        -s dir \
        --log error \
        --vendor InfluxData \
        --url https://github.com/influxdata/chronograf \
        --after-install etc/scripts/post-install.sh \
        --after-remove etc/scripts/post-uninstall.sh \
        --license AGPL \
        --maintainer contact@influxdb.com \
        --description "Open source monitoring and visualization UI for the entire TICK stack." \
        --config-files /etc/logrotate.d/chronograf \
        --name chronograf \
        -a $PKG_ARCH \
        -t deb \
        --version "$TAG~$SHORTSHA" \
        -p $BUILD_DIR \
        $EXE=/usr/bin/$BINARY \
        $PKG_DIR/scripts=/usr/lib/chronograf \
        $PKG_DIR/logrotate.d=/etc \
        $PKG_DIR/canned=/usr/share/chronograf
}

rpm_package ()
{
    fpm -f \
        -s dir \
        --log error \
        --vendor InfluxData \
        --url https://github.com/influxdata/chronograf \
        --after-install etc/scripts/post-install.sh \
        --after-remove etc/scripts/post-uninstall.sh \
        --license AGPL \
        --maintainer contact@influxdb.com \
        --description "Open source monitoring and visualization UI for the entire TICK stack." \
        --config-files /etc/logrotate.d/chronograf \
        --name chronograf \
        -a $PKG_ARCH \
        -t rpm \
        --rpm-digest sha256 \
        --version "$TAG~$SHORTSHA" \
        --depends coreutils \
        -p $BUILD_DIR \
        $EXE=/usr/bin/$BINARY \
        $PKG_DIR/scripts=/usr/lib/chronograf \
        $PKG_DIR/logrotate.d=/etc \
        $PKG_DIR/canned=/usr/share/chronograf
}

tar_package ()
{
    OUTPUT_DIR=$PWD/build
    mkdir -p $OUTPUT_DIR

    TMP_DIR=$(mktemp -d)
    TAR_DIR=$TMP_DIR/chronograf-$TAG-$SHORTSHA
    mkdir -p $TAR_DIR
    cp $EXE $TAR_DIR
    pushd $TMP_DIR
    tar zcvf $OUTPUT_DIR/chronograf-${TAG}-${SHORTSHA}_${PKG_ARCH}.tar.gz -C $TMP_DIR chronograf-$TAG-$SHORTSHA --owner=0 --group=0
    popd
    rm -rf $TMP_DIR
}

build_linux ()
{
    mkdir -p $PKG_DIR/canned && cp $SRC/canned/*.json $PKG_DIR/canned && chmod 644 $PKG_DIR/canned/*.json
    mkdir -p $PKG_DIR/logrotate.d && cp $SRC/etc/scripts/logrotate $PKG_DIR/logrotate.d/chronograf
    mkdir -p $PKG_DIR/scripts && cp $SRC/etc/scripts/{chronograf.service,post-install.sh,post-uninstall.sh,init.sh} $PKG_DIR/scripts
    BINARY=chronograf
    GOOS=linux
    
    GOARCH=386
        set_exe
        go_build
        #TODO: fix tar package
        PKG_ARCH=i386
            tar_package
            deb_package
            rpm_package
        PKG_ARCH=static_i386
            go_build_static
            tar_package

    GOARCH=amd64
        set_exe
        go_build
        PKG_ARCH=amd64
            tar_package
            deb_package
        PKG_ARCH=x86_64
            rpm_package
        PKG_ARCH=static_amd64
            go_build_static
            tar_package

    GOARCH=arm64
        set_exe
        go_build
        PKG_ARCH=arm64
            deb_package
        PKG_ARCH=aarch64
            rpm_package

    GOARCH=arm
    GOARM=7
        set_exe
        go_build
        PKG_ARCH=armhf
            deb_package
        PKG_ARCH=armv7hl
            rpm_package
    
    GOARM=6
        set_exe
        go_build
        PKG_ARCH=armel
            deb_package

    rm -rf $PKG_DIR
}

build_windows ()
{
    OUTPUT_DIR=$PWD/build
    mkdir -p $OUTPUT_DIR

    TMP_DIR=$(mktemp -d)
    GOOS=windows GOARCH=amd64 go build -o $TMP_DIR/chronograf-$TAG-$SHORTSHA/chronograf.exe -ldflags="-X main.version=$TAG -X main.commit=$SHA" $SRC/cmd/chronograf

    pushd $TMP_DIR
    zip chronograf-${TAG}-${SHORTSHA}_windows.zip -r chronograf-$TAG-$SHORTSHA
    mv chronograf-${TAG}-${SHORTSHA}_windows.zip $OUTPUT_DIR
    popd
    rm -rf $TMP_DIR
}

build_mac ()
{
    OUTPUT_DIR=$PWD/build
    mkdir -p $OUTPUT_DIR

    TMP_DIR=$(mktemp -d) 
    GOOS=darwin GOARCH=amd64 go build -o $TMP_DIR/chronograf-$TAG-$SHORTSHA/chronograf -ldflags="-X main.version=$TAG -X main.commit=$SHA" $SRC/cmd/chronograf

    pushd $TMP_DIR
    tar  zcvf $OUTPUT_DIR/chronograf-${TAG}-${SHORTSHA}_osx.tar.gz chronograf-$TAG-$SHORTSHA --owner=0 --group=0
    popd
    rm -rf $TMP_DIR
}

build_windows
build_mac
build_linux