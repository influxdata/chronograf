package util

import (
	"net/url"
)

// AppendPath appends path to the supplied URL and returns a new URL instance.
func AppendPath(url *url.URL, path string) *url.URL {
	retVal := *url
	if len(path) == 0 {
		return &retVal
	}
	if path[0] != '/' {
		path = "/" + path
	}
	if len(retVal.Path) > 0 && retVal.Path[len(retVal.Path)-1] == '/' {
		retVal.Path = retVal.Path[0 : len(retVal.Path)-1]
	}
	retVal.Path += path
	return &retVal
}
