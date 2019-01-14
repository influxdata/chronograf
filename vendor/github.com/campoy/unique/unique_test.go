package unique

import (
	"reflect"
	"testing"
)

func ints(vs ...int) *[]int { return &vs }
func lessInt(v interface{}) func(i, j int) bool {
	s := *v.(*[]int)
	return func(i, j int) bool { return s[i] < s[j] }
}

func strings(vs ...string) *[]string { return &vs }
func lessString(v interface{}) func(i, j int) bool {
	s := *v.(*[]string)
	return func(i, j int) bool { return s[i] < s[j] }
}

func TestSlice(t *testing.T) {
	tt := []struct {
		name    string
		in, out interface{}
		less    func(interface{}) func(i, j int) bool
	}{
		{
			"ints",
			ints(5, 1, 3, 6, 3, 5),
			ints(1, 3, 5, 6),
			lessInt,
		},
		{
			"empty ints",
			ints(),
			ints(),
			lessInt,
		},
		{
			"strings",
			strings("one", "two", "three", "two", "one"),
			strings("one", "three", "two"),
			lessString,
		},
		{
			"just one string many times",
			strings("one", "one", "one", "one"),
			strings("one"),
			lessString,
		},
	}

	for _, tc := range tt {
		t.Run(tc.name, func(t *testing.T) {
			Slice(tc.in, tc.less(tc.in))
			if !reflect.DeepEqual(tc.in, tc.out) {
				t.Fatalf("expected %v; got %v", tc.out, tc.in)
			}
		})
	}
}
