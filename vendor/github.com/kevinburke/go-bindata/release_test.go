package bindata

import "testing"

var sanitizeTests = []struct {
	in  string
	out string
}{
	{`hello`, "`hello`"},
	{"hello\nworld", "`hello\nworld`"},
	{"`ello", "(\"`\" + `ello`)"},
	{"`a`e`i`o`u`", "(((\"`\" + `a`) + (\"`\" + (`e` + \"`\"))) + ((`i` + (\"`\" + `o`)) + (\"`\" + (`u` + \"`\"))))"},
	{"\xEF\xBB\xBF`s away!", "(\"\\xEF\\xBB\\xBF\" + (\"`\" + `s away!`))"},
}

func TestSanitize(t *testing.T) {
	for _, tt := range sanitizeTests {
		out := []byte(sanitize([]byte(tt.in)))
		if string(out) != tt.out {
			t.Errorf("sanitize(%q):\nhave %q\nwant %q", tt.in, out, tt.out)
		}
	}
}
