package yarpc

import (
	"context"
	"encoding/binary"
	"errors"
	"io"

	"github.com/influxdata/yamux"
	"github.com/influxdata/yarpc/codes"
	"github.com/influxdata/yarpc/status"
)

type StreamHandler func(srv interface{}, stream ServerStream) error

type StreamDesc struct {
	Index      uint8
	StreamName string
	Handler    StreamHandler

	ServerStreams bool
	ClientStreams bool
}

// Stream defines the common interface a client or server stream has to satisfy.
type Stream interface {
	// Context returns the context for this stream.
	Context() context.Context
	// SendMsg blocks until it sends m, the stream is done or the stream
	// breaks.
	// On error, it aborts the stream and returns an RPC status on client
	// side. On server side, it simply returns the error to the caller.
	// SendMsg is called by generated code. Also Users can call SendMsg
	// directly when it is really needed in their use cases.
	// It's safe to have a goroutine calling SendMsg and another goroutine calling
	// recvMsg on the same stream at the same time.
	// But it is not safe to call SendMsg on the same stream in different goroutines.
	SendMsg(m interface{}) error
	// RecvMsg blocks until it receives a message or the stream is
	// done. On client side, it returns io.EOF when the stream is done. On
	// any other error, it aborts the stream and returns an RPC status. On
	// server side, it simply returns the error to the caller.
	// It's safe to have a goroutine calling SendMsg and another goroutine calling
	// recvMsg on the same stream at the same time.
	// But it is not safe to call RecvMsg on the same stream in different goroutines.
	RecvMsg(m interface{}) error
}

// ClientStream defines the interface a client stream has to satisfy.
type ClientStream interface {
	// CloseSend closes the send direction of the stream. It closes the stream
	// when non-nil error is met.
	CloseSend() error
	Stream
}

func NewClientStream(ctx context.Context, desc *StreamDesc, cc *ClientConn, api uint16) (ClientStream, error) {
	cn, err := cc.NewStream()
	if err != nil {
		return nil, err
	}

	var tmp [2]byte
	binary.BigEndian.PutUint16(tmp[:], api)
	_, err = cn.Write(tmp[:])
	if err != nil {
		return nil, err
	}

	cs := &clientStream{
		cn:      cn,
		codec:   cc.dopts.codec,
		p:       &parser{r: cn},
		desc:    desc,
		ctx:     ctx,
		closing: make(chan struct{}),
	}
	go func() {
		select {
		case <-ctx.Done():
			cs.CloseSend()
		case <-cs.closing:
		}
	}()

	return cs, nil
}

type clientStream struct {
	cn    *yamux.Stream
	codec Codec
	p     *parser
	desc  *StreamDesc

	ctx     context.Context
	closing chan struct{}
}

func (c *clientStream) CloseSend() error {
	select {
	case <-c.closing:
	default:
		close(c.closing)
	}
	return c.cn.Close()
}

func (c *clientStream) Context() context.Context {
	return c.ctx
}

func (c *clientStream) SendMsg(m interface{}) error {
	select {
	case <-c.closing:
		return errors.New("stream closed")
	default:
	}
	out, err := encode(c.codec, m)
	if err != nil {
		return err
	}

	_, err = c.cn.Write(out)
	return err
}

func (c *clientStream) RecvMsg(m interface{}) error {
	select {
	case <-c.closing:
		return errors.New("stream closed")
	default:
	}
	err := decode(c.p, c.codec, c.cn, m)
	if err == nil {
		if !c.desc.ClientStreams || c.desc.ServerStreams {
			return nil
		}
	}
	return err
}

type ServerStream interface {
	Stream
}

type serverStream struct {
	cn    *yamux.Stream
	codec Codec
	p     *parser
	buf   []byte
}

func (s *serverStream) Context() context.Context {
	panic("implement me")
}

func (s *serverStream) SendMsg(m interface{}) error {
	out, err := encode(s.codec, m)
	if err != nil {
		return err
	}

	_, err = s.cn.Write(out)
	if err != nil {
		// TODO(sgc): wrap in status error
		return err
	}
	return nil
}

func (s *serverStream) RecvMsg(m interface{}) error {
	if err := decode(s.p, s.codec, s.cn, m); err != nil {
		if err == io.EOF {
			return err
		}
		if err == io.ErrUnexpectedEOF {
			err = status.Errorf(codes.Internal, io.ErrUnexpectedEOF.Error())
		}
		// TODO(sgc): wrap in status error
		return err
	}
	return nil
}
