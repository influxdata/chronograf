package util_test

import (
	"net/url"
	"testing"

	"github.com/influxdata/chronograf/util"
)

func Test_AppendPath(t *testing.T) {
	tests := []struct {
		url      string
		path     string
		expected string
	}{
		{
			url:      "http://localhost:8086?t=1#asdf",
			path:     "",
			expected: "http://localhost:8086?t=1#asdf",
		},
		{
			url:      "http://localhost:8086?t=1#asdf",
			path:     "a",
			expected: "http://localhost:8086/a?t=1#asdf",
		},
		{
			url:      "http://localhost:8086/?t=1#asdf",
			path:     "",
			expected: "http://localhost:8086/?t=1#asdf",
		},
		{
			url:      "http://localhost:8086/a?t=1#asdf",
			path:     "",
			expected: "http://localhost:8086/a?t=1#asdf",
		},
		{
			url:      "http://localhost:8086/a?t=1#asdf",
			path:     "b",
			expected: "http://localhost:8086/a/b?t=1#asdf",
		},
		{
			url:      "http://localhost:8086/a?t=1#asdf",
			path:     "/b",
			expected: "http://localhost:8086/a/b?t=1#asdf",
		},
		{
			url:      "http://localhost:8086/a/?t=1#asdf",
			path:     "b",
			expected: "http://localhost:8086/a/b?t=1#asdf",
		},
		{
			url:      "http://localhost:8086/a/?t=1#asdf",
			path:     "/b",
			expected: "http://localhost:8086/a/b?t=1#asdf",
		},
	}

	for _, test := range tests {
		inURL, _ := url.Parse(test.url)
		outURL := util.AppendPath(inURL, test.path)
		if inURL == outURL {
			t.Errorf("AppendPath(\"%v\",\"%v\") does not return a new URL instance", inURL, test.path)
		}
		out := outURL.String()
		if out != test.expected {
			t.Errorf("AppendPath(\"%v\",\"%v\") != \"%v\"", inURL, test.path, test.expected)
		}
	}
}
