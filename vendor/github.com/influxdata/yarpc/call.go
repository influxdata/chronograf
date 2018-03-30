package yarpc

import (
	"context"
	"encoding/binary"

	"github.com/influxdata/yamux"
)

func Invoke(ctx context.Context, api uint16, args interface{}, reply interface{}, cc *ClientConn) error {
	stream, err := cc.NewStream()
	if err != nil {
		// TODO(sgc): convert to RPC error
		return err
	}
	defer stream.Close()

	var tmp [2]byte
	binary.BigEndian.PutUint16(tmp[:], api)
	_, err = stream.Write(tmp[:])
	if err != nil {
		return err
	}

	err = sendRequest(ctx, cc.dopts, stream, args)
	if err != nil {
		return err
	}

	err = recvResponse(ctx, cc.dopts, stream, reply)
	if err != nil {
		return err
	}

	return nil
}

func sendRequest(ctx context.Context, dopts dialOptions, stream *yamux.Stream, args interface{}) error {
	outBuf, err := encode(dopts.codec, args)
	if err != nil {
		return err
	}
	_, err = stream.Write(outBuf)
	return err
}

func recvResponse(ctx context.Context, dopts dialOptions, stream *yamux.Stream, reply interface{}) error {
	p := &parser{r: stream}
	err := decode(p, dopts.codec, stream, reply)
	if err != nil {
		return err
	}
	return nil
}
