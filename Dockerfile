FROM alpine:3.12

ENV PROTOBOARDS_PATH /usr/share/chronograf/protoboards
ENV CANNED_PATH /usr/share/chronograf/canned
ENV RESOURCES_PATH /usr/share/chronograf/resources
ENV BOLT_PATH /var/lib/chronograf/chronograf-v1.db

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

CMD ["/usr/bin/chronograf"]
