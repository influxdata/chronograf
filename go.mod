module github.com/influxdata/chronograf

go 1.16

require (
	cloud.google.com/go/bigtable v1.10.0 // indirect
	github.com/NYTimes/gziphandler v1.1.1
	github.com/abbot/go-http-auth v0.4.0
	github.com/bouk/httprouter v0.0.0-20160817010721-ee8b3818a7f5
	github.com/dgrijalva/jwt-go v3.2.0+incompatible
	github.com/elazarl/go-bindata-assetfs v1.0.0
	github.com/gogo/protobuf v1.3.2
	github.com/google/go-cmp v0.5.5
	github.com/google/go-github v17.0.0+incompatible
	github.com/google/uuid v1.1.2
	github.com/influxdata/flux v0.114.1
	github.com/influxdata/influxdb v1.8.4
	github.com/influxdata/kapacitor v1.5.10-0.20210518140415-452f2b236610
	github.com/influxdata/usage-client v0.0.0-20160829180054-6d3895376368
	github.com/jessevdk/go-flags v1.4.0
	github.com/kevinburke/go-bindata v3.22.0+incompatible // indirect
	github.com/lestrrat-go/jwx v0.9.0
	github.com/microcosm-cc/bluemonday v1.0.15
	github.com/sergi/go-diff v1.1.0
	github.com/sirupsen/logrus v1.7.0
	github.com/stretchr/testify v1.7.0
	go.etcd.io/bbolt v1.3.5
	go.etcd.io/etcd/client/v3 v3.5.0-alpha.0
	go.etcd.io/etcd/server/v3 v3.5.0-alpha.0
	golang.org/x/net v0.0.0-20210614182718-04defd469f4e
	golang.org/x/oauth2 v0.0.0-20210427180440-81ed05c6b58c
	google.golang.org/api v0.46.0
)

replace github.com/coreos/go-systemd => github.com/coreos/go-systemd/v22 v22.0.0

replace github.com/prometheus/prometheus => github.com/goller/prometheus v1.6.1-0.20170502220046-58298e738211

replace github.com/influxdata/influxdb => github.com/influxdata/influxdb v1.1.5

replace github.com/influxdata/flux => github.com/influxdata/flux v0.65.1
