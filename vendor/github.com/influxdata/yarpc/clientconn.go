package yarpc

import (
	"net"

	"context"

	"github.com/influxdata/yamux"
)

type dialOptions struct {
	codec Codec
}

type DialOption func(*dialOptions)

func WithCodec(c Codec) DialOption {
	return func(o *dialOptions) {
		o.codec = c
	}
}

func Dial(addr string, opt ...DialOption) (*ClientConn, error) {
	return DialContext(context.Background(), addr, opt...)
}

func DialContext(ctx context.Context, addr string, opts ...DialOption) (*ClientConn, error) {
	cn, err := net.Dial("tcp", addr)
	if err != nil {
		return nil, err
	}

	s, err := yamux.Client(cn, nil)
	if err != nil {
		return nil, err
	}
	cc := &ClientConn{s: s}
	cc.ctx, cc.cancel = context.WithCancel(ctx)

	for _, opt := range opts {
		opt(&cc.dopts)
	}

	if cc.dopts.codec == nil {
		cc.dopts.codec = NewCodec()
	}

	return cc, nil
}

type ClientConn struct {
	ctx    context.Context
	cancel context.CancelFunc
	s      *yamux.Session
	dopts  dialOptions
}

func (cc *ClientConn) NewStream() (*yamux.Stream, error) {
	return cc.s.OpenStream()
}

func (cc *ClientConn) Close() error {
	cc.cancel()
	return cc.s.Close()
}
