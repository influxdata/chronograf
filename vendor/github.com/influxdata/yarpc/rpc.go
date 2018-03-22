package yarpc

//go:generate protoc -I$GOPATH/src -I. --gogofaster_out=. codes/codes.proto
//go:generate protoc -I$GOPATH/src -I. --gogofaster_out=. status/status.proto
//go:generate protoc -I$GOPATH/src -I. --gogofaster_out=Mgoogle/protobuf/descriptor.proto=github.com/gogo/protobuf/protoc-gen-gogo/descriptor:. yarpcproto/yarpc.proto

const (
	SupportPackageIsVersion1 = true
)
