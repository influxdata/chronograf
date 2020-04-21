package main

import (
	"testing"

	flags "github.com/jessevdk/go-flags"
)

func TestChronoctlCommands(t *testing.T) {
	tests := []struct {
		args []string
		err  bool
	}{
		{
			args: []string{"not", "a", "command"},
			err:  true,
		},
		{
			args: []string{"add-superadmin", "-h"},
			err:  false,
		},
		{
			args: []string{"gen-keypair", "-h"},
			err:  false,
		},
		{
			args: []string{"list-users", "-h"},
			err:  false,
		},
		{
			args: []string{"token", "-h"},
			err:  false,
		},
	}

	for _, test := range tests {
		t.Log("Testing", test.args)
		if _, err := parser.ParseArgs(test.args); err != nil {
			if flagsErr, ok := err.(*flags.Error); ok && flagsErr.Type == flags.ErrHelp {
				if test.err {
					t.Errorf("%v - should have failed", test.args)
				}
			} else {
				if !test.err {
					t.Errorf("%v - shouldn't have failed", test.args)
				}
			}
		}
	}
}
