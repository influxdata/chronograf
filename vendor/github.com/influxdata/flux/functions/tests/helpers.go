package tests

import (
	"github.com/influxdata/flux"
)

func init() {
	flux.RegisterBuiltIn("testhelpers", helpersBuiltIn)
}

var helpersBuiltIn = `
testingTest = (name, load, infile, outfile, test) => {
  input = load(file: infile)
  got = input |> test()
  want = load(file: outfile)
  return assertEquals(name: name, want: want, got: got)
}
`
