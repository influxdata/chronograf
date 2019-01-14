//+build gofuzz

package parser

// Fuzz will run the parser on the input data and return 1 on success and 0 on failure.
func Fuzz(data []byte) int {
	if _, err := NewAST(string(data)); err != nil {
		return 0
	}
	return 1
}
