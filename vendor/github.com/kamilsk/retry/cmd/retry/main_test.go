package main

import (
	"io/ioutil"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestMain_Exec_Fails(t *testing.T) {
	var status int
	application{
		Args:   []string{"cmd", "unknown"},
		Stderr: ioutil.Discard, Stdout: ioutil.Discard,
		Shutdown: func(code int) { status = code },
	}.Run()

	assert.Equal(t, 1, status)
}
