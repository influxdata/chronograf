package yarpc

import (
	"encoding/binary"
	"io"
	"sync"

	"github.com/gogo/protobuf/codec"
	"github.com/influxdata/yamux"
	"github.com/influxdata/yarpc/codes"
	"github.com/influxdata/yarpc/status"
)

var (
	codecPool = &sync.Pool{
		New: func() interface{} {
			return codec.New(1024)
		},
	}
)

type pooledCodec struct{}

var (
	cd = &pooledCodec{}
)

func NewCodec() Codec {
	return cd
}

func (*pooledCodec) Marshal(v interface{}) ([]byte, error) {
	ci := codecPool.Get()
	c := ci.(codec.Codec)
	data, err := c.Marshal(v)
	codecPool.Put(ci)
	return data, err
}

func (*pooledCodec) Unmarshal(data []byte, v interface{}) error {
	ci := codecPool.Get()
	c := ci.(codec.Codec)
	err := c.Unmarshal(data, v)
	codecPool.Put(ci)
	return err
}

type Codec interface {
	Marshal(v interface{}) ([]byte, error)
	Unmarshal(data []byte, v interface{}) error
}

type parser struct {
	r      io.Reader
	header [4]byte
}

func (p *parser) recvMsg() (msg []byte, err error) {
	if _, err := io.ReadFull(p.r, p.header[:]); err != nil {
		return nil, err
	}

	length := binary.BigEndian.Uint32(p.header[:])
	if length == 0 {
		return nil, nil
	}

	msg = make([]byte, int(length))
	if _, err := io.ReadFull(p.r, msg); err != nil {
		if err == io.EOF {
			err = io.ErrUnexpectedEOF
		}
		return nil, err
	}
	return msg, nil
}

func encode(c Codec, msg interface{}) ([]byte, error) {
	var (
		b      []byte
		length uint
	)

	if msg != nil {
		var err error
		b, err = c.Marshal(msg)
		if err != nil {
			// TODO(sgc): should return error with status code "internal"
			return nil, status.Errorf(codes.Internal, "rpc: error while marshaling %v", err)
		}
		length = uint(len(b))
	}

	const (
		sizeLen = 4
	)

	var buf = make([]byte, sizeLen+length)
	binary.BigEndian.PutUint32(buf, uint32(length))
	copy(buf[4:], b)

	return buf, nil
}

func decode(p *parser, c Codec, s *yamux.Stream, m interface{}) error {
	d, err := p.recvMsg()
	if err != nil {
		return err
	}

	if err := c.Unmarshal(d, m); err != nil {
		return status.Errorf(codes.Internal, "rpc: failed to unmarshal received message %v", err)
	}

	return nil
}
