package yarpc

import (
	"net"

	"encoding/binary"
	"io"

	"context"

	"reflect"

	"log"

	"github.com/influxdata/yamux"
	"github.com/influxdata/yarpc/codes"
	"github.com/influxdata/yarpc/status"
)

type methodHandler func(srv interface{}, ctx context.Context, dec func(interface{}) error) (interface{}, error)

type MethodDesc struct {
	Index      uint8
	MethodName string
	Handler    methodHandler
}

// ServiceDesc represents an RPC service's specification.
type ServiceDesc struct {
	Index       uint8
	ServiceName string
	// The pointer to the service interface. Used to check whether the user
	// provided implementation satisfies the interface requirements.
	HandlerType interface{}
	Methods     []MethodDesc
	Streams     []StreamDesc
	Metadata    interface{}
}

type service struct {
	server interface{}
	md     map[uint8]*MethodDesc
	sd     map[uint8]*StreamDesc
}

type Server struct {
	opts  options
	m     map[uint8]*service
	serve bool
	lis   net.Listener
}

type options struct {
	codec Codec
}

type ServerOption func(*options)

func CustomCodec(c Codec) ServerOption {
	return func(o *options) {
		o.codec = c
	}
}

func NewServer(opts ...ServerOption) *Server {
	s := &Server{
		m: make(map[uint8]*service),
	}

	for _, opt := range opts {
		opt(&s.opts)
	}

	// defaults
	if s.opts.codec == nil {
		s.opts.codec = NewCodec()
	}

	return s
}

// RegisterService registers a service and its implementation to the gRPC
// server. It is called from the IDL generated code. This must be called before
// invoking Serve.
func (s *Server) RegisterService(sd *ServiceDesc, ss interface{}) {
	ht := reflect.TypeOf(sd.HandlerType).Elem()
	st := reflect.TypeOf(ss)
	if !st.Implements(ht) {
		log.Fatalf("rpc: Server.RegisterService found the handler of type %v that does not satisfy %v", st, ht)
	}
	s.register(sd, ss)
}

func (s *Server) register(sd *ServiceDesc, ss interface{}) {
	// s.opts.log.Info("register service", zap.String("name", sd.ServiceName), zap.Uint("index", uint(sd.Index)))
	if s.serve {
		log.Fatalf("rpc: Server.RegisterService after Server.Serve for %q", sd.ServiceName)
	}
	if _, ok := s.m[sd.Index]; ok {
		log.Fatalf("rpc: Server.RegisterService found duplicate service registration for %q", sd.ServiceName)
	}

	srv := &service{
		server: ss,
		md:     make(map[uint8]*MethodDesc),
		sd:     make(map[uint8]*StreamDesc),
	}
	for i := range sd.Methods {
		d := &sd.Methods[i]
		srv.md[d.Index] = d
	}
	for i := range sd.Streams {
		d := &sd.Streams[i]
		srv.sd[d.Index] = d
	}
	s.m[sd.Index] = srv
}

func (s *Server) Serve(lis net.Listener) error {
	s.lis = lis
	for {
		rawConn, err := lis.Accept()
		if err != nil {
			if ne, ok := err.(interface {
				Temporary() bool
			}); ok && ne.Temporary() {
				// TODO(sgc): add logic to handle temporary errors
			}
			return err
		}

		go s.handleRawConn(rawConn)
	}
}

func (s *Server) Stop() {
	if s.lis != nil {
		s.lis.Close()
		s.lis = nil
	}
}

func (s *Server) handleRawConn(rawConn net.Conn) {
	session, err := yamux.Server(rawConn, nil)
	if err != nil {
		log.Printf("ERR yamux.Server failed: error=%v", err)
		rawConn.Close()
		return
	}

	s.serveSession(session)
}

func (s *Server) serveSession(session *yamux.Session) {
	for {
		stream, err := session.AcceptStream()
		if err != nil {
			if err != io.EOF {
				// TODO(sgc): handle session errors
				log.Printf("ERR session.AcceptStream failed: error=%v", err)
				session.Close()
			}
			return
		}

		go s.handleStream(stream)
	}
}

func decodeServiceMethod(v uint16) (svc, mth uint8) {
	//┌────────────────────────┬────────────────────────┐
	//│      SERVICE (8)       │       METHOD (8)       │
	//└────────────────────────┴────────────────────────┘

	return uint8(v >> 8), uint8(v)
}

func (s *Server) handleStream(st *yamux.Stream) {
	defer st.Close()

	var tmp [2]byte
	io.ReadAtLeast(st, tmp[:], 2)
	service, method := decodeServiceMethod(binary.BigEndian.Uint16(tmp[:]))
	srv, ok := s.m[service]
	if !ok {
		// TODO(sgc): handle unknown service
		log.Printf("invalid service identifier: service=%d", service)
		return
	}

	if md, ok := srv.md[method]; ok {
		// handle unary
		s.handleUnaryRPC(st, srv, md)
		return
	}

	if sd, ok := srv.sd[method]; ok {
		// handle unary
		s.handleStreamingRPC(st, srv, sd)
		return
	}

	// TODO(sgc): handle unknown method
	log.Printf("ERR invalid method identifier: service=%d method=%d", service, method)
}

func (s *Server) handleStreamingRPC(st *yamux.Stream, srv *service, sd *StreamDesc) {
	ss := &serverStream{
		cn:    st,
		codec: s.opts.codec,
		p:     &parser{r: st},
	}

	var appErr error
	var server interface{}
	if srv != nil {
		server = srv.server
	}

	appErr = sd.Handler(server, ss)
	if appErr != nil {
		// TODO(sgc): handle app error using similar code style to gRPC
		log.Printf("ERR sd.Handler failed: error=%v", appErr)
		// appStatus, ok := status.FromError(appErr)
		return
	}

	// TODO(sgc): write OK status?
}

func (s *Server) handleUnaryRPC(st *yamux.Stream, srv *service, md *MethodDesc) error {
	p := &parser{r: st}
	req, err := p.recvMsg()
	if err == io.EOF {
		return err
	}

	if err == io.ErrUnexpectedEOF {
		return status.Errorf(codes.Internal, err.Error())
	}

	df := func(v interface{}) error {
		if err := s.opts.codec.Unmarshal(req, v); err != nil {
			return status.Errorf(codes.Internal, "rpc: error unmarshalling request: %v", err)
		}
		return nil
	}

	reply, appErr := md.Handler(srv.server, context.Background(), df)
	if appErr != nil {
		appStatus, ok := status.FromError(appErr)
		if !ok {
			// convert to app error
			appStatus = &status.Status{Code: codes.Unknown, Message: appErr.Error()}
			appErr = appStatus
		}

		// TODO(sgc): write error status
		return appErr
	}

	if err := s.sendResponse(st, reply); err != nil {
		if err == io.EOF {
			return err
		}

		if s, ok := status.FromError(err); ok {
			// TODO(sgc): write error status
			_ = s
		}

		return err
	}

	// TODO(sgc): write OK status
	return nil
}

func (s *Server) sendResponse(stream *yamux.Stream, msg interface{}) error {
	buf, err := encode(s.opts.codec, msg)
	if err != nil {
		// s.opts.log.Error("rpc: server failed to encode reply", zap.Error(err))
		return err
	}

	_, err = stream.Write(buf)
	return err
}
