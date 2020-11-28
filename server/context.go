package server

import (
	"context"
)

type serverContextKey string

// ServerContextKey is the key used to specify that the
// server is making the requet via context
const ServerContextKey = serverContextKey("server")

// hasServerContext speficies if the context contains
// the ServerContextKey and that the value stored there is true
func hasServerContext(ctx context.Context) bool {
	// prevents panic in case of nil context
	if ctx == nil {
		return false
	}
	sa, ok := ctx.Value(ServerContextKey).(bool)
	// should never happen
	if !ok {
		return false
	}
	return sa
}

func serverContext(ctx context.Context) context.Context {
	if ctx == nil {
		ctx = context.Background() // context could be possible nil before go 1.15, see https://github.com/golang/go/issues/40737
	}
	return context.WithValue(ctx, ServerContextKey, true)
}
