#!/bin/bash

apt update && DEBIAN_FRONTEND=noninteractive apt install -y \
    apt-transport-https \
    python3-dev \
    wget \
    curl \
    git \
    mercurial \
    make \
    ruby \
    ruby-dev \
    rpm \
    zip \
    python3-pip \
    autoconf \
    libtool

pip3 install boto requests python-jose --upgrade
gem install dotenv -v 2.8.1
gem install fpm

NODE_VERSION=v16.14.2
wget -q https://nodejs.org/dist/${NODE_VERSION}/node-${NODE_VERSION}-linux-x64.tar.gz; \
    mkdir /usr/local/node; \
    tar -xvf node-${NODE_VERSION}-linux-x64.tar.gz -C /usr/local/node --strip-components=1; \
    rm -f node-${NODE_VERSION}-linux-x64.tar.gz
export PATH=/usr/local/node/bin:$PATH

curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add - && \
    echo "deb https://dl.yarnpkg.com/debian/ stable main" | tee /etc/apt/sources.list.d/yarn.list &&  \
    apt-get update -y && apt-get install yarn -y
