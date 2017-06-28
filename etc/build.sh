#!/bin/bash

# defaults
SRC=${SRC-"."}
DESTDIR=${DESTDIR-"./build"}
BINARY=${BINARY-chronograf}
EXE=$DESTDIR/$BINARY
GOARM=${GOARM-""}
TAG=$(git describe --always --tags --abbrev=0)
SHA=$(git rev-parse HEAD)
RELEASE_LDFLAGS=${RELEASE_LDFLAGS-"-X main.version=$TAG -X main.commit=$SHA"}
GOLDFLAGS=${GOLDFLAGS-"-s -w"}

case "$1" in
-static)
        CGO_ENABLED=0
        shift
        ;;
esac

case "$#" in
0)
        ;;
*)
        echo 'usage: GOOS=linux GOARCH=amd64 build.sh [-static]' 1>&2
        exit 2
esac

GOOSARCH="${GOOS}_${GOARCH}"
case "$GOOSARCH" in
_* | *_ | _)
        echo 'undefined $GOOS_$GOARCH:' "$GOOSARCH" 1>&2
        exit 1
        ;;
darwin_amd64 | linux_386 | linux_amd64 | linux_arm64)
        ;;
windows_amd64)
        EXE=${EXE}.exe
        ;;
linux_arm)
        case "$GOARM" in
        6 | 7)
            ;;
        *)
            echo 'undefined $GOARM:' "$GOARM" 1>&2
            exit 1
        ;;
        esac
        ;;
*)
        echo 'unrecognized $GOOS_$GOARCH: ' "$GOOSARCH" 1>&2
        exit 1
        ;;
esac

cd $SRC
printf "GOOS=${GOOS} GOARCH=${GOARCH} "
if [ -n "$GOARM" ]
then
    printf "GOARM=${GOARM} "
fi

if [ -n "$CGO_ENABLED" ]
then
    printf "CGO_ENABLED=${CGO_ENABLED} "
fi
printf "go build -a -o ${EXE} -ldflags=\"${RELEASE_LDFLAGS} ${GOLDFLAGS}\"  ${SRC}/cmd/chronograf\n"
go build -a -o ${EXE} -ldflags="${RELEASE_LDFLAGS} ${GOLDFLAGS}"  ${SRC}/cmd/chronograf
