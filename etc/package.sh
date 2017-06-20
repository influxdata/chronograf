#!/bin/bash
#TODO: static?
#TODO: Add license
SRC=${SRC-"."}
PKG_DIR=${PKG_DIR-"package"}

TAG="$(git describe --always --tags --abbrev=0)"
SHORTSHA="$(git log --pretty=format:'%h' -n 1)"

case "$1" in
rpm | deb | tar | zip)
        PKG="$1"
        shift
        ;;
*)
        echo 'usage: GOOS=linux GOARCH=amd64 package.sh deb|rpm|tar build/chronograf' 1>&2
        exit 2
esac

case "$#" in
1)
        EXE="$1"
        ;;
*)
        echo 'usage: GOOS=linux GOARCH=amd64 package.sh deb|rpm|tar build/chronograf' 1>&2
        exit 2
esac

GOOSARCHPKG="${GOOS}_${GOARCH}_${PKG}"
case "$GOOSARCHPKG" in
darwin_amd64_tar)
    PKG_ARCH=amd64
    PKG_OS=osx
    ;;
windows_amd64_zip)
    PKG_ARCH=amd64
    PKG_OS=windows
    ;;
linux_386_deb)
    PKG_ARCH=i386
    PKG_OS=linux
    ;;
linux_386_rpm)
    PKG_ARCH=i386
    PKG_OS=linux
    ;;
linux_386_tar)
    PKG_ARCH=i386
    PKG_OS=linux
    ;;
linux_amd64_deb)
    PKG_ARCH=amd64
    PKG_OS=linux
    ;;
linux_amd64_rpm)
    PKG_ARCH=x86_64
    PKG_OS=linux
    ;;
linux_amd64_tar)
    PKG_ARCH=amd64
    PKG_OS=linux
    ;;
linux_arm64_deb)
    PKG_ARCH=arm64
    PKG_OS=linux
    ;;
linux_arm64_rpm)
    PKG_ARCH=aarch64
    PKG_OS=linux
    ;;
linux_arm_rpm)
    PKG_OS=linux
    case "$GOARM" in
    7)
        PKG_ARCH=armv7hl
        ;;
    *)
        echo 'undefined $GOARM:' "$GOARM" 'for ' "$GOOSARCHPKG" 1>&2
        exit 1
        ;;
    esac
    ;;
linux_arm_deb)
    PKG_OS=linux
    case "$GOARM" in
    7)
        PKG_ARCH=armhf
        ;;
    6)
        PKG_ARCH=armel
        ;;
    *)
        echo 'undefined $GOARM:' "$GOARM" 'for ' "$GOOSARCHPKG" 1>&2
        exit 2
        ;;
    esac
    ;;
*)
    echo 'unrecognized $GOOS_$GOARCH_$PKG: ' "$GOOSARCHPKG" 1>&2
    exit 2
    ;;
esac

add_support_files ()
{
    SUPPORT_DIR=$PKG_DIR/support
    mkdir -p $SUPPORT_DIR/canned && cp $SRC/canned/*.json $SUPPORT_DIR/canned && chmod 644 $SUPPORT_DIR/canned/*.json
    mkdir -p $SUPPORT_DIR/logrotate.d && cp $SRC/etc/scripts/logrotate $SUPPORT_DIR/logrotate.d/chronograf
    mkdir -p $SUPPORT_DIR/scripts && cp $SRC/etc/scripts/{chronograf.service,post-install.sh,post-uninstall.sh,init.sh} $SUPPORT_DIR/scripts
}

rm_support_files ()
{
    rm -rf $SUPPORT_DIR
}

case "$PKG" in
deb)
    add_support_files

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
        -a ${PKG_ARCH} \
        -t deb \
        --version "$TAG~$SHORTSHA" \
        -p ${PKG_DIR} \
        $EXE=/usr/bin/chronograf \
        $SUPPORT_DIR/scripts=/usr/lib/chronograf \
        $SUPPORT_DIR/logrotate.d=/etc \
        $SUPPORT_DIR/canned=/usr/share/chronograf

    rm_support_files
    ;;
rpm)
    add_support_files

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
        -p ${PKG_DIR} \
        $EXE=/usr/bin/chronograf \
        $SUPPORT_DIR/scripts=/usr/lib/chronograf \
        $SUPPORT_DIR/logrotate.d=/etc \
        $SUPPORT_DIR/canned=/usr/share/chronograf

    rm_support_files
    ;;
tar)
    mkdir -p $PKG_DIR
    TMP_DIR=$(mktemp -d)
    TAR_DIR=$TMP_DIR/chronograf-$TAG-$SHORTSHA
    mkdir -p $TAR_DIR
    cp $EXE $TAR_DIR
    tar zcvf $PKG_DIR/chronograf-${TAG}-${SHORTSHA}_${PKG_OS}_${PKG_ARCH}.tar.gz -C $TMP_DIR chronograf-$TAG-$SHORTSHA --owner=0 --group=0
    rm -rf $TMP_DIR
    ;;
zip)
    mkdir -p $PKG_DIR
    TMP_DIR=$(mktemp -d)
    ZIP_DIR=$TMP_DIR/chronograf-$TAG-$SHORTSHA
    mkdir -p $ZIP_DIR
    cp $EXE $ZIP_DIR
    pushd $TMP_DIR 1> /dev/null
    zip chronograf-${TAG}-${SHORTSHA}_${PKG_OS}_${PKG_ARCH}.zip -r chronograf-$TAG-$SHORTSHA 1> /dev/null
    popd 1> /dev/null
    mv $TMP_DIR/chronograf-${TAG}-${SHORTSHA}_${PKG_OS}_${PKG_ARCH}.zip $PKG_DIR
    rm -rf $TMP_DIR
    ;;
esac
