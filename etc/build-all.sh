#!/bin/sh
BINARY=chronograf-windows-amd64 GOOS=windows GOARCH=amd64 sh etc/build.sh
BINARY=chronograf-darwin-amd64 GOOS=darwin GOARCH=amd64 sh etc/build.sh
BINARY=chronograf-linux-amd64 GOOS=linux GOARCH=amd64 sh etc/build.sh
BINARY=chronograf-linux-386   GOOS=linux GOARCH=386 sh etc/build.sh
BINARY=chronograf-linux-arm64 GOOS=linux GOARCH=arm64 sh etc/build.sh
BINARY=chronograf-linux-arm6 GOOS=linux GOARCH=arm GOARM=6 sh etc/build.sh
BINARY=chronograf-linux-arm7 GOOS=linux GOARCH=arm GOARM=7 sh etc/build.sh

GOOS=windows GOARCH=amd64 sh etc/package.sh zip build/chronograf-windows-amd64.exe

GOOS=darwin GOARCH=amd64 sh etc/package.sh tar build/chronograf-darwin-amd64

GOOS=linux GOARCH=amd64 sh etc/package.sh tar build/chronograf-linux-amd64
GOOS=linux GOARCH=amd64 sh etc/package.sh deb build/chronograf-linux-amd64
GOOS=linux GOARCH=amd64 sh etc/package.sh rpm build/chronograf-linux-amd64

GOOS=linux GOARCH=386 sh etc/package.sh tar build/chronograf-linux-386
GOOS=linux GOARCH=386 sh etc/package.sh deb build/chronograf-linux-386
GOOS=linux GOARCH=386 sh etc/package.sh rpm build/chronograf-linux-386

GOOS=linux GOARCH=arm64 sh etc/package.sh deb build/chronograf-linux-arm64
GOOS=linux GOARCH=arm64 sh etc/package.sh rpm build/chronograf-linux-arm64

GOOS=linux GOARCH=arm GOARM=6 sh etc/package.sh deb build/chronograf-linux-arm6
GOOS=linux GOARCH=arm GOARM=7 sh etc/package.sh deb build/chronograf-linux-arm7
GOOS=linux GOARCH=arm GOARM=7 sh etc/package.sh rpm build/chronograf-linux-arm7