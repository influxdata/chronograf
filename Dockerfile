FROM alpine:3.12
MAINTAINER Chris Goller <chris@influxdb.com>

ENV PROTOBOARDS_PATH /usr/share/chronograf/protoboards

RUN apk add --update ca-certificates && \
    rm /var/cache/apk/*

ADD chronograf /usr/bin/chronograf
ADD chronoctl /usr/bin/chronoctl
ADD canned/*.json /usr/share/chronograf/canned/
ADD protoboards/*.json /usr/share/chronograf/protoboards/
ADD LICENSE /usr/share/chronograf/LICENSE
ADD agpl-3.0.md /usr/share/chronograf/agpl-3.0.md

EXPOSE 8888
VOLUME ["/usr/share/chronograf", "/var/lib/chronograf"]

CMD ["/usr/bin/chronograf", "-b", "/var/lib/chronograf/chronograf-v1.db", "-c", "/usr/share/chronograf/canned"]
