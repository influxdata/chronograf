FROM ruby:2.4.1-stretch

# This dockerfile is capabable of performing all
# build/test/package/deploy actions needed for IFQL.

LABEL maintainer="contact@influxdb.com"

RUN apt-get update && apt-get -y install \
    apt-transport-https \
    curl \
    gnupg2 \
    rubygems-integration \
    ruby-dev \
    ruby \
    build-essential \
    rsync \
    rpm \
    tar \
    zip \
    && rm -rf /var/lib/apt/lists/*

RUN gem install fpm -v 1.9.3

# Install go
ENV GOPATH /root/go
ENV GO_VERSION 1.10
ENV GO_ARCH amd64
RUN wget -q https://storage.googleapis.com/golang/go${GO_VERSION}.linux-${GO_ARCH}.tar.gz &&  \
   tar -C /usr/local/ -xf /go${GO_VERSION}.linux-${GO_ARCH}.tar.gz && \
   rm /go${GO_VERSION}.linux-${GO_ARCH}.tar.gz
ENV PATH /usr/local/go/bin:$PATH

# Install go dep
RUN go get github.com/golang/dep/...

ENV PROJECT_DIR $GOPATH/src/github.com/influxdata/ifql
ENV PATH $GOPATH/bin:$PATH
RUN mkdir -p $PROJECT_DIR
WORKDIR $PROJECT_DIR

VOLUME $PROJECT_DIR
VOLUME /root/go/src
