package status

import (
	"fmt"

	"github.com/influxdata/yarpc/codes"
)

func (m *Status) Error() string {
	return fmt.Sprintf("rpc error: code = %s desc = %s", m.Code, m.Message)
}

// FromError returns a Status representing err if it was produced from this
// package, otherwise it returns nil, false.
func FromError(err error) (s *Status, ok bool) {
	if err == nil {
		return &Status{Code: codes.OK}, true
	}
	if s, ok := err.(*Status); ok {
		return s, true
	}
	return nil, false
}

// Errorf returns Error(c, fmt.Sprintf(format, a...)).
func Errorf(c codes.Code, format string, a ...interface{}) error {
	return &Status{Code: c, Message: fmt.Sprintf(format, a...)}
}
