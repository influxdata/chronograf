FROM golang:1.10 as builder
ENV GOPATH /
RUN go get github.com/golang/dep/...
ADD . /src/github.com/influxdata/ifql
WORKDIR /src/github.com/influxdata/ifql
RUN go get github.com/golang/dep/... && \
    CGO_ENABLED=0 go build -ldflags "-s" -a -installsuffix cgo -i -o bin/ifqld ./cmd/ifqld

FROM alpine
RUN apk add --no-cache ca-certificates tzdata
EXPOSE 8093/tcp
COPY --from=builder /src/github.com/influxdata/ifql/bin/ifqld /
COPY --from=builder /src/github.com/influxdata/ifql/LICENSE /
ENTRYPOINT ["/ifqld"]
