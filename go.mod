module github.com/influxdata/chronograf

require (
	github.com/NYTimes/gziphandler v1.1.1
	github.com/boltdb/bolt v1.3.1
	github.com/bouk/httprouter v0.0.0-20160817010721-ee8b3818a7f5
	github.com/coreos/bbolt v1.3.3 // indirect
	github.com/coreos/etcd v3.3.18+incompatible
	github.com/coreos/go-semver v0.3.0 // indirect
	github.com/coreos/go-systemd v0.0.0-00010101000000-000000000000 // indirect
	github.com/coreos/pkg v0.0.0-20180928190104-399ea9e2e55f // indirect
	github.com/dgrijalva/jwt-go v3.2.0+incompatible
	github.com/dustin/go-humanize v1.0.0 // indirect
	github.com/elazarl/go-bindata-assetfs v1.0.0
	github.com/gogo/protobuf v1.3.1
	github.com/golang/groupcache v0.0.0-20191227052852-215e87163ea7 // indirect
	github.com/golang/protobuf v1.3.3 // indirect
	github.com/google/go-cmp v0.3.0
	github.com/google/go-github v17.0.0+incompatible
	github.com/google/go-querystring v1.0.0 // indirect
	github.com/google/uuid v1.1.1
	github.com/gorilla/websocket v1.4.1 // indirect
	github.com/grpc-ecosystem/go-grpc-middleware v1.1.0 // indirect
	github.com/grpc-ecosystem/go-grpc-prometheus v1.2.0 // indirect
	github.com/grpc-ecosystem/grpc-gateway v1.12.1 // indirect
	github.com/influxdata/flux v0.65.0
	github.com/influxdata/influxdb v1.1.5
	github.com/influxdata/kapacitor v1.5.3
	github.com/influxdata/usage-client v0.0.0-20160829180054-6d3895376368
	github.com/jessevdk/go-flags v1.4.0
	github.com/jonboulle/clockwork v0.1.0 // indirect
	github.com/lestrrat-go/jwx v0.9.0
	github.com/microcosm-cc/bluemonday v1.0.2
	github.com/segmentio/kafka-go v0.3.4 // indirect
	github.com/sergi/go-diff v1.1.0
	github.com/sirupsen/logrus v1.6.0
	github.com/soheilhy/cmux v0.1.4 // indirect
	github.com/stretchr/testify v1.4.0
	github.com/tmc/grpc-websocket-proxy v0.0.0-20190109142713-0ad062ec5ee5 // indirect
	github.com/xiang90/probing v0.0.0-20190116061207-43a291ad63a2 // indirect
	go.etcd.io/bbolt v1.3.3 // indirect
	go.uber.org/atomic v1.5.1 // indirect
	go.uber.org/multierr v1.4.0 // indirect
	go.uber.org/zap v1.13.0 // indirect
	golang.org/x/crypto v0.0.0-20191227163750-53104e6ec876 // indirect
	golang.org/x/lint v0.0.0-20191125180803-fdd1cda4f05f // indirect
	golang.org/x/net v0.0.0-20191209160850-c0dbc17a3553
	golang.org/x/oauth2 v0.0.0-20190604053449-0f29369cfe45
	golang.org/x/sys v0.0.0-20200107162124-548cf772de50 // indirect
	golang.org/x/tools v0.0.0-20200107050322-53017a39ae36 // indirect
	google.golang.org/api v0.15.0
	gopkg.in/yaml.v2 v2.2.7 // indirect
	sigs.k8s.io/yaml v1.1.0 // indirect
)

replace github.com/coreos/go-systemd => github.com/coreos/go-systemd/v22 v22.0.0

// avoid dependency error: https://gonum.org/v1/gonum?go-get=1 (status code 404)
replace gonum.org/v1/gonum v0.0.0-20181121035319-3f7ecaa7e8ca => github.com/gonum/gonum v0.0.0-20181121035319-3f7ecaa7e8ca

// avoid dependency error: https://gonum.org/v1/netlib?go-get=1 (status code 404)
replace gonum.org/v1/netlib v0.0.0-20181029234149-ec6d1f5cefe6 => github.com/gonum/netlib v0.0.0-20181029234149-ec6d1f5cefe6

go 1.13
