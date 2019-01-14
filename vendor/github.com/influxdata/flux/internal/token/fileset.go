package token

import (
	"github.com/influxdata/flux/ast"
)

type File struct {
	name  string
	lines []int // lines contains the offset of the first character for each line (the first entry is always 0)
	sz    int
}

func NewFile(name string, sz int) *File {
	return &File{
		name:  name,
		lines: []int{0},
		sz:    sz,
	}
}

func (f *File) AddLine(offset int) {
	f.lines = append(f.lines, offset)
}

func (f *File) Name() string {
	return f.name
}

// Offset returns the offset for the given line/column.
func (f *File) Offset(pos ast.Position) int {
	if pos.Line == 0 || pos.Column == 0 {
		return -1
	}
	offset := f.lines[pos.Line-1]
	return offset + pos.Column - 1
}

func (f *File) Base() int {
	return 1
}

func (f *File) Size() int {
	return f.sz
}

func (f *File) Pos(offset int) Pos {
	return Pos(offset + 1)
}

func (f *File) Position(pos Pos) ast.Position {
	offset := int(pos) - 1
	i := searchInts(f.lines, offset)
	return ast.Position{
		Line:   i + 1,
		Column: offset - f.lines[i] + 1,
	}
}

// This is copied from the go source code:
// https://golang.org/src/go/token/position.go
func searchInts(a []int, x int) int {
	// This function body is a manually inlined version of:
	//
	//   return sort.Search(len(a), func(i int) bool { return a[i] > x }) - 1
	//
	// With better compiler optimizations, this may not be needed in the
	// future, but at the moment this change improves the go/printer
	// benchmark performance by ~30%. This has a direct impact on the
	// speed of gofmt and thus seems worthwhile (2011-04-29).
	// TODO(gri): Remove this when compilers have caught up.
	i, j := 0, len(a)
	for i < j {
		h := i + (j-i)/2 // avoid overflow when computing h
		// i ≤ h < j
		if a[h] <= x {
			i = h + 1
		} else {
			j = h
		}
	}
	return i - 1
}
