module github.com/hws522/chronograf

go 1.15

require (
	github.com/NYTimes/gziphandler v1.1.1
	github.com/abbot/go-http-auth v0.4.0
	github.com/bouk/httprouter v0.0.0-20160817010721-ee8b3818a7f5
	github.com/dgrijalva/jwt-go v3.2.0+incompatible
	github.com/elazarl/go-bindata-assetfs v1.0.0
	github.com/gogo/protobuf v1.3.1
	github.com/google/go-cmp v0.4.0
	github.com/google/go-github v17.0.0+incompatible
	github.com/google/uuid v1.1.1
	github.com/influxdata/chronograf v0.0.0-20210401081855-7815527b1b25
	github.com/influxdata/flux v0.65.0
	github.com/influxdata/influxdb v1.1.5
	github.com/influxdata/kapacitor v1.5.8
	github.com/influxdata/usage-client v0.0.0-20160829180054-6d3895376368
	github.com/jessevdk/go-flags v1.4.0
	github.com/lestrrat-go/jwx v0.9.0
	github.com/microcosm-cc/bluemonday v1.0.2
	github.com/sergi/go-diff v1.1.0
	github.com/sirupsen/logrus v1.6.0
	github.com/stretchr/testify v1.4.0
	go.etcd.io/bbolt v1.3.5
	go.etcd.io/etcd v0.5.0-alpha.5.0.20201125193152-8a03d2e9614b
	golang.org/x/net v0.0.0-20201006153459-a7d1128ccaa0
	golang.org/x/oauth2 v0.0.0-20190604053449-0f29369cfe45
	google.golang.org/api v0.15.0
)

replace github.com/coreos/go-systemd => github.com/coreos/go-systemd/v22 v22.0.0

replace github.com/prometheus/prometheus => github.com/goller/prometheus v1.6.1-0.20170502220046-58298e738211
