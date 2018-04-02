package execute

import (
	"math"
	"time"
)

type Time int64
type Duration int64

const (
	MaxTime = math.MaxInt64
	MinTime = math.MinInt64

	fixedWidthTimeFmt = "2006-01-02T15:04:05.000000000Z"
)

func (t Time) Round(d Duration) Time {
	if d <= 0 {
		return t
	}
	r := remainder(t, d)
	if lessThanHalf(r, d) {
		return t - Time(r)
	}
	return t + Time(d-r)
}

func (t Time) Truncate(d Duration) Time {
	if d <= 0 {
		return t
	}
	r := remainder(t, d)
	return t - Time(r)
}

func (t Time) Add(d Duration) Time {
	return t + Time(d)
}

func Now() Time {
	return Time(time.Now().UnixNano())
}

// lessThanHalf reports whether x+x < y but avoids overflow,
// assuming x and y are both positive (Duration is signed).
func lessThanHalf(x, y Duration) bool {
	return uint64(x)+uint64(x) < uint64(y)
}

// remainder divides t by d and returns the remainder.
func remainder(t Time, d Duration) (r Duration) {
	return Duration(int64(t) % int64(d))
}

func (t Time) String() string {
	return t.Time().Format(fixedWidthTimeFmt)
}

func (t Time) Time() time.Time {
	return time.Unix(0, int64(t)).UTC()
}

func (d Duration) String() string {
	return time.Duration(d).String()
}
