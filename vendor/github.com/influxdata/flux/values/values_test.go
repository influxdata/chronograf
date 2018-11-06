package values_test

import (
	"fmt"
	"regexp"
	"testing"

	"github.com/influxdata/flux/semantic"
	"github.com/influxdata/flux/values"
)

func TestNew(t *testing.T) {
	for _, tt := range []struct {
		v    interface{}
		want values.Value
	}{
		{v: "abc", want: values.NewString("abc")},
		{v: int64(4), want: values.NewInt(4)},
		{v: uint64(4), want: values.NewUInt(4)},
		{v: float64(6.0), want: values.NewFloat(6.0)},
		{v: true, want: values.NewBool(true)},
		{v: values.Time(1000), want: values.NewTime(values.Time(1000))},
		{v: values.Duration(1), want: values.NewDuration(values.Duration(1))},
		{v: regexp.MustCompile(`.+`), want: values.NewRegexp(regexp.MustCompile(`.+`))},
		{v: values.NewArray(semantic.String), want: values.InvalidValue},
	} {
		t.Run(fmt.Sprint(tt.want.Type()), func(t *testing.T) {
			if want, got := tt.want, values.New(tt.v); !want.Equal(got) {
				if want.Type() == semantic.Invalid && got.Type() == semantic.Invalid {
					// If the wanted type is invalid and the gotten type is invalid, these
					// are the same even though they do not equal each other.
					return
				}
				t.Fatalf("unexpected value -want/+got\n\t- %s\n\t+ %s", want, got)
			}
		})
	}
}
