Download the protobuf binary by either:
- `brew install protobuf`
- Download from protobuf [github release](https://github.com/protocolbuffers/protobuf/releases/tag/v3.17.3) and place in your $PATH


run the following command
```sh
go install google.golang.org/protobuf/cmd/protoc-gen-go
```

now, you can regenerate the `.proto` file: `protoc --go_out=. internal.proto`
