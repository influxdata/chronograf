package yarpcproto

import (
	"reflect"

	proto "github.com/gogo/protobuf/proto"
	google_protobuf "github.com/gogo/protobuf/protoc-gen-gogo/descriptor"
)

func GetServiceIndex(service *google_protobuf.ServiceDescriptorProto) int {
	return GetIntExtension(service.Options, E_YarpcServiceIndex, -1)
}

func GetMethodIndex(service *google_protobuf.MethodDescriptorProto) int {
	return GetIntExtension(service.Options, E_YarpcMethodIndex, -1)
}

func GetIntExtension(pb proto.Message, extension *proto.ExtensionDesc, ifnotset int) int {
	if reflect.ValueOf(pb).IsNil() {
		return ifnotset
	}
	value, err := proto.GetExtension(pb, extension)
	if err != nil {
		return ifnotset
	}
	if value == nil {
		return ifnotset
	}
	if value.(*uint32) == nil {
		return ifnotset
	}
	return int(*(value.(*uint32)))
}
