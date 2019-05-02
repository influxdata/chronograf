#!/bin/bash

DATA_DIR=/var/lib/chronograf

# create user
if ! id chronograf >/dev/null 2>&1; then
    useradd --system -U -M chronograf -s /bin/false -d $DATA_DIR
fi
