package unique_test

import (
	"fmt"

	"github.com/campoy/unique"
)

func ExampleSlice() {
	s := []int{3, 5, 1, 7, 2, 3, 7, 5, 2}
	less := func(i, j int) bool { return s[i] < s[j] }
	unique.Slice(&s, less)
	fmt.Println(s)
	// Output:
	// [1 2 3 5 7]
}
