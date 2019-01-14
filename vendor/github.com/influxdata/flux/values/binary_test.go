package values_test

import (
	"fmt"
	"regexp"
	"testing"

	"github.com/influxdata/flux/ast"
	"github.com/influxdata/flux/values"
)

func TestBinaryOperator(t *testing.T) {
	for _, tt := range []struct {
		lhs, rhs interface{}
		op       string
		want     interface{}
	}{
		// int + int
		{lhs: int64(6), op: "+", rhs: int64(4), want: int64(10)},
		// uint + uint
		{lhs: uint64(6), op: "+", rhs: uint64(4), want: uint64(10)},
		// float + float
		{lhs: 4.5, op: "+", rhs: 8.2, want: 12.7},
		// int - int
		{lhs: int64(6), op: "-", rhs: int64(4), want: int64(2)},
		// uint - uint
		{lhs: uint64(6), op: "-", rhs: uint64(4), want: uint64(2)},
		// float - float
		{lhs: 4.5, op: "-", rhs: 8.0, want: -3.5},
		// int * int
		{lhs: int64(6), op: "*", rhs: int64(4), want: int64(24)},
		// uint * uint
		{lhs: uint64(6), op: "*", rhs: uint64(4), want: uint64(24)},
		// float * float
		{lhs: 4.5, op: "*", rhs: 8.2, want: 36.9},
		// int / int
		{lhs: int64(6), op: "/", rhs: int64(4), want: int64(1)},
		// uint / uint
		{lhs: uint64(6), op: "/", rhs: uint64(4), want: uint64(1)},
		// float / float
		{lhs: 5.0, op: "/", rhs: 2.0, want: 2.5},
		// int <= int
		{lhs: int64(6), op: "<=", rhs: int64(4), want: false},
		{lhs: int64(4), op: "<=", rhs: int64(4), want: true},
		{lhs: int64(4), op: "<=", rhs: int64(6), want: true},
		// int <= uint
		{lhs: int64(6), op: "<=", rhs: uint64(4), want: false},
		{lhs: int64(4), op: "<=", rhs: uint64(4), want: true},
		{lhs: int64(4), op: "<=", rhs: uint64(6), want: true},
		// int <= float
		{lhs: int64(8), op: "<=", rhs: 6.7, want: false},
		{lhs: int64(6), op: "<=", rhs: 6.0, want: true},
		{lhs: int64(4), op: "<=", rhs: 6.7, want: true},
		// uint <= int
		{lhs: uint64(6), op: "<=", rhs: int64(4), want: false},
		{lhs: uint64(4), op: "<=", rhs: int64(4), want: true},
		{lhs: uint64(4), op: "<=", rhs: int64(6), want: true},
		// uint <= uint
		{lhs: uint64(6), op: "<=", rhs: uint64(4), want: false},
		{lhs: uint64(4), op: "<=", rhs: uint64(4), want: true},
		{lhs: uint64(4), op: "<=", rhs: uint64(6), want: true},
		// uint <= float
		{lhs: uint64(8), op: "<=", rhs: 6.7, want: false},
		{lhs: uint64(6), op: "<=", rhs: 6.0, want: true},
		{lhs: uint64(4), op: "<=", rhs: 6.7, want: true},
		// float <= int
		{lhs: 6.7, op: "<=", rhs: int64(4), want: false},
		{lhs: 6.0, op: "<=", rhs: int64(6), want: true},
		{lhs: 6.7, op: "<=", rhs: int64(8), want: true},
		// float <= uint
		{lhs: 6.7, op: "<=", rhs: uint64(4), want: false},
		{lhs: 6.0, op: "<=", rhs: uint64(6), want: true},
		{lhs: 6.7, op: "<=", rhs: uint64(8), want: true},
		// float <= float
		{lhs: 8.2, op: "<=", rhs: 4.5, want: false},
		{lhs: 4.5, op: "<=", rhs: 4.5, want: true},
		{lhs: 4.5, op: "<=", rhs: 8.2, want: true},
		// string <= string
		{lhs: "", op: "<=", rhs: "x", want: true},
		{lhs: "x", op: "<=", rhs: "", want: false},
		{lhs: "x", op: "<=", rhs: "x", want: true},
		{lhs: "x", op: "<=", rhs: "a", want: false},
		{lhs: "x", op: "<=", rhs: "abc", want: false},
		// int < int
		{lhs: int64(6), op: "<", rhs: int64(4), want: false},
		{lhs: int64(4), op: "<", rhs: int64(4), want: false},
		{lhs: int64(4), op: "<", rhs: int64(6), want: true},
		// int < uint
		{lhs: int64(6), op: "<", rhs: uint64(4), want: false},
		{lhs: int64(4), op: "<", rhs: uint64(4), want: false},
		{lhs: int64(4), op: "<", rhs: uint64(6), want: true},
		// int < float
		{lhs: int64(8), op: "<", rhs: 6.7, want: false},
		{lhs: int64(6), op: "<", rhs: 6.0, want: false},
		{lhs: int64(4), op: "<", rhs: 6.7, want: true},
		// uint < int
		{lhs: uint64(6), op: "<", rhs: int64(4), want: false},
		{lhs: uint64(4), op: "<", rhs: int64(4), want: false},
		{lhs: uint64(4), op: "<", rhs: int64(6), want: true},
		// uint < uint
		{lhs: uint64(6), op: "<", rhs: uint64(4), want: false},
		{lhs: uint64(4), op: "<", rhs: uint64(4), want: false},
		{lhs: uint64(4), op: "<", rhs: uint64(6), want: true},
		// uint < float
		{lhs: uint64(8), op: "<", rhs: 6.7, want: false},
		{lhs: uint64(6), op: "<", rhs: 6.0, want: false},
		{lhs: uint64(4), op: "<", rhs: 6.7, want: true},
		// float < int
		{lhs: 6.7, op: "<", rhs: int64(4), want: false},
		{lhs: 6.0, op: "<", rhs: int64(6), want: false},
		{lhs: 6.7, op: "<", rhs: int64(8), want: true},
		// float < uint
		{lhs: 6.7, op: "<", rhs: uint64(4), want: false},
		{lhs: 6.0, op: "<", rhs: uint64(6), want: false},
		{lhs: 6.7, op: "<", rhs: uint64(8), want: true},
		// float < float
		{lhs: 8.2, op: "<", rhs: 4.5, want: false},
		{lhs: 4.5, op: "<", rhs: 4.5, want: false},
		{lhs: 4.5, op: "<", rhs: 8.2, want: true},
		// string < string
		{lhs: "", op: "<", rhs: "x", want: true},
		{lhs: "x", op: "<", rhs: "", want: false},
		{lhs: "x", op: "<", rhs: "x", want: false},
		{lhs: "x", op: "<", rhs: "a", want: false},
		{lhs: "x", op: "<", rhs: "abc", want: false},
		// int >= int
		{lhs: int64(6), op: ">=", rhs: int64(4), want: true},
		{lhs: int64(4), op: ">=", rhs: int64(4), want: true},
		{lhs: int64(4), op: ">=", rhs: int64(6), want: false},
		// int >= uint
		{lhs: int64(6), op: ">=", rhs: uint64(4), want: true},
		{lhs: int64(4), op: ">=", rhs: uint64(4), want: true},
		{lhs: int64(4), op: ">=", rhs: uint64(6), want: false},
		// int >= float
		{lhs: int64(8), op: ">=", rhs: 6.7, want: true},
		{lhs: int64(6), op: ">=", rhs: 6.0, want: true},
		{lhs: int64(4), op: ">=", rhs: 6.7, want: false},
		// uint >= int
		{lhs: uint64(6), op: ">=", rhs: int64(4), want: true},
		{lhs: uint64(4), op: ">=", rhs: int64(4), want: true},
		{lhs: uint64(4), op: ">=", rhs: int64(6), want: false},
		// uint >= uint
		{lhs: uint64(6), op: ">=", rhs: uint64(4), want: true},
		{lhs: uint64(4), op: ">=", rhs: uint64(4), want: true},
		{lhs: uint64(4), op: ">=", rhs: uint64(6), want: false},
		// uint >= float
		{lhs: uint64(8), op: ">=", rhs: 6.7, want: true},
		{lhs: uint64(6), op: ">=", rhs: 6.0, want: true},
		{lhs: uint64(4), op: ">=", rhs: 6.7, want: false},
		// float >= int
		{lhs: 6.7, op: ">=", rhs: int64(4), want: true},
		{lhs: 6.0, op: ">=", rhs: int64(6), want: true},
		{lhs: 6.7, op: ">=", rhs: int64(8), want: false},
		// float >= uint
		{lhs: 6.7, op: ">=", rhs: uint64(4), want: true},
		{lhs: 6.0, op: ">=", rhs: uint64(6), want: true},
		{lhs: 6.7, op: ">=", rhs: uint64(8), want: false},
		// float >= float
		{lhs: 8.2, op: ">=", rhs: 4.5, want: true},
		{lhs: 4.5, op: ">=", rhs: 4.5, want: true},
		{lhs: 4.5, op: ">=", rhs: 8.2, want: false},
		// string >= string
		{lhs: "", op: ">=", rhs: "x", want: false},
		{lhs: "x", op: ">=", rhs: "", want: true},
		{lhs: "x", op: ">=", rhs: "x", want: true},
		{lhs: "x", op: ">=", rhs: "a", want: true},
		{lhs: "x", op: ">=", rhs: "abc", want: true},
		// int > int
		{lhs: int64(6), op: ">", rhs: int64(4), want: true},
		{lhs: int64(4), op: ">", rhs: int64(4), want: false},
		{lhs: int64(4), op: ">", rhs: int64(6), want: false},
		// int > uint
		{lhs: int64(6), op: ">", rhs: uint64(4), want: true},
		{lhs: int64(4), op: ">", rhs: uint64(4), want: false},
		{lhs: int64(4), op: ">", rhs: uint64(6), want: false},
		// int > float
		{lhs: int64(8), op: ">", rhs: 6.7, want: true},
		{lhs: int64(6), op: ">", rhs: 6.0, want: false},
		{lhs: int64(4), op: ">", rhs: 6.7, want: false},
		// uint > int
		{lhs: uint64(6), op: ">", rhs: int64(4), want: true},
		{lhs: uint64(4), op: ">", rhs: int64(4), want: false},
		{lhs: uint64(4), op: ">", rhs: int64(6), want: false},
		// uint > uint
		{lhs: uint64(6), op: ">", rhs: uint64(4), want: true},
		{lhs: uint64(4), op: ">", rhs: uint64(4), want: false},
		{lhs: uint64(4), op: ">", rhs: uint64(6), want: false},
		// uint > float
		{lhs: uint64(8), op: ">", rhs: 6.7, want: true},
		{lhs: uint64(6), op: ">", rhs: 6.0, want: false},
		{lhs: uint64(4), op: ">", rhs: 6.7, want: false},
		// float > int
		{lhs: 6.7, op: ">", rhs: int64(4), want: true},
		{lhs: 6.0, op: ">", rhs: int64(6), want: false},
		{lhs: 6.7, op: ">", rhs: int64(8), want: false},
		// float > uint
		{lhs: 6.7, op: ">", rhs: uint64(4), want: true},
		{lhs: 6.0, op: ">", rhs: uint64(6), want: false},
		{lhs: 6.7, op: ">", rhs: uint64(8), want: false},
		// float > float
		{lhs: 8.2, op: ">", rhs: 4.5, want: true},
		{lhs: 4.5, op: ">", rhs: 8.2, want: false},
		{lhs: 4.5, op: ">", rhs: 4.5, want: false},
		// string > string
		{lhs: "", op: ">", rhs: "x", want: false},
		{lhs: "x", op: ">", rhs: "", want: true},
		{lhs: "x", op: ">", rhs: "x", want: false},
		{lhs: "x", op: ">", rhs: "a", want: true},
		{lhs: "x", op: ">", rhs: "abc", want: true},
		// int == int
		{lhs: int64(4), op: "==", rhs: int64(4), want: true},
		{lhs: int64(6), op: "==", rhs: int64(4), want: false},
		// int == uint
		{lhs: int64(4), op: "==", rhs: uint64(4), want: true},
		{lhs: int64(6), op: "==", rhs: uint64(4), want: false},
		// int == float
		{lhs: int64(4), op: "==", rhs: float64(4), want: true},
		{lhs: int64(6), op: "==", rhs: float64(4), want: false},
		// uint == int
		{lhs: uint64(4), op: "==", rhs: int64(4), want: true},
		{lhs: uint64(6), op: "==", rhs: int64(4), want: false},
		// uint == uint
		{lhs: uint64(4), op: "==", rhs: uint64(4), want: true},
		{lhs: uint64(6), op: "==", rhs: uint64(4), want: false},
		// uint == float
		{lhs: uint64(4), op: "==", rhs: float64(4), want: true},
		{lhs: uint64(6), op: "==", rhs: float64(4), want: false},
		// float == int
		{lhs: float64(4), op: "==", rhs: int64(4), want: true},
		{lhs: float64(6), op: "==", rhs: int64(4), want: false},
		// float == uint
		{lhs: float64(4), op: "==", rhs: uint64(4), want: true},
		{lhs: float64(6), op: "==", rhs: uint64(4), want: false},
		// float == float
		{lhs: float64(4), op: "==", rhs: float64(4), want: true},
		{lhs: float64(6), op: "==", rhs: float64(4), want: false},
		// string == string
		{lhs: "a", op: "==", rhs: "a", want: true},
		{lhs: "a", op: "==", rhs: "b", want: false},
		// int != int
		{lhs: int64(4), op: "!=", rhs: int64(4), want: false},
		{lhs: int64(6), op: "!=", rhs: int64(4), want: true},
		// int != uint
		{lhs: int64(4), op: "!=", rhs: uint64(4), want: false},
		{lhs: int64(6), op: "!=", rhs: uint64(4), want: true},
		// int != float
		{lhs: int64(4), op: "!=", rhs: float64(4), want: false},
		{lhs: int64(6), op: "!=", rhs: float64(4), want: true},
		// uint != int
		{lhs: uint64(4), op: "!=", rhs: int64(4), want: false},
		{lhs: uint64(6), op: "!=", rhs: int64(4), want: true},
		// uint != uint
		{lhs: uint64(4), op: "!=", rhs: uint64(4), want: false},
		{lhs: uint64(6), op: "!=", rhs: uint64(4), want: true},
		// uint != float
		{lhs: uint64(4), op: "!=", rhs: float64(4), want: false},
		{lhs: uint64(6), op: "!=", rhs: float64(4), want: true},
		// float != int
		{lhs: float64(4), op: "!=", rhs: int64(4), want: false},
		{lhs: float64(6), op: "!=", rhs: int64(4), want: true},
		// float != uint
		{lhs: float64(4), op: "!=", rhs: uint64(4), want: false},
		{lhs: float64(6), op: "!=", rhs: uint64(4), want: true},
		// float != float
		{lhs: float64(4), op: "!=", rhs: float64(4), want: false},
		{lhs: float64(6), op: "!=", rhs: float64(4), want: true},
		// string != string
		{lhs: "a", op: "!=", rhs: "a", want: false},
		{lhs: "a", op: "!=", rhs: "b", want: true},
		// string =~ regex
		{lhs: "abc", op: "=~", rhs: regexp.MustCompile(`.+`), want: true},
		{lhs: "abc", op: "=~", rhs: regexp.MustCompile(`b{2}`), want: false},
		// regex =~ string
		{lhs: regexp.MustCompile(`.+`), op: "=~", rhs: "abc", want: true},
		{lhs: regexp.MustCompile(`b{2}`), op: "=~", rhs: "abc", want: false},
		// string !~ regex
		{lhs: "abc", op: "!~", rhs: regexp.MustCompile(`.+`), want: false},
		{lhs: "abc", op: "!~", rhs: regexp.MustCompile(`b{2}`), want: true},
		// regex !~ string
		{lhs: regexp.MustCompile(`.+`), op: "!~", rhs: "abc", want: false},
		{lhs: regexp.MustCompile(`b{2}`), op: "!~", rhs: "abc", want: true},
		// string + string
		{lhs: "a", op: "+", rhs: "b", want: "ab"},
	} {
		t.Run(fmt.Sprintf("%v %s %v", tt.lhs, tt.op, tt.rhs), func(t *testing.T) {
			left, right := values.New(tt.lhs), values.New(tt.rhs)
			fn, err := values.LookupBinaryFunction(values.BinaryFuncSignature{
				Operator: ast.OperatorLookup(tt.op),
				Left:     left.Type(),
				Right:    right.Type(),
			})
			if err != nil {
				t.Fatal(err)
			}

			if want, got := values.New(tt.want), fn(left, right); !want.Equal(got) {
				t.Fatalf("unexpected value -want/+got\n\t- %s\n\t+ %s", want, got)
			}
		})
	}
}
