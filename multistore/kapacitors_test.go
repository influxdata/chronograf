package multistore

import (
	"testing"

	"github.com/hws522/chronograf"
)

func TestInterfaceImplementation(t *testing.T) {
	var _ chronograf.ServersStore = &KapacitorStore{}
}
