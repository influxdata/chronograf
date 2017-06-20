#!/bin/sh

## go get github.com/koblas/s3-cli
case "$#" in
2)
        ;;
*)
        echo 'usage: upload.sh src_dir dest_bucket' 1>&2
        exit 2
esac
echo s3-cli -v --force --check-md5 -r cp $1 $2