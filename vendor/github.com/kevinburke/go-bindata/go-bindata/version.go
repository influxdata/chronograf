// This work is subject to the CC0 1.0 Universal (CC0 1.0) Public Domain Dedication
// license. Its contents can be found at:
// http://creativecommons.org/publicdomain/zero/1.0/

package main

import (
	"fmt"
	"runtime"
)

const (
	AppName         = "go-bindata"
	AppVersionMajor = 3
	AppVersionMinor = 7
	AppVersionRev   = 0
)

func Version() string {
	return fmt.Sprintf(`go-bindata version %d.%d.%d`, AppVersionMajor, AppVersionMinor, AppVersionRev)
}

func LongVersion() string {
	return fmt.Sprintf(`%s %d.%d.%d (Go runtime %s).
Copyright (c) 2010-2015, Jim Teeuwen.
Copyright (c) 2017-2018, Kevin Burke.`, AppName, AppVersionMajor, AppVersionMinor, AppVersionRev, runtime.Version())
}
