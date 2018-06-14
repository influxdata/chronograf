package dist

import (
	"bytes"
	"fmt"
	"html/template"
	"io/ioutil"
	"net/http"
	"os"
	"path/filepath"
)

// Dir functions like http.Dir except returns the content of a default file if not found.
type Dir struct {
	Base    string
	Default string
	dir     http.Dir
}

// NewDir constructs a Dir with a default file
func NewDir(dir, def, base string) Dir {
	return Dir{
		Default: def,
		Base:    base,
		dir:     http.Dir(dir),
	}
}

// Foo is a bs struct that we are making up for now
type Foo struct {
	*os.File
	d Dir
}

// Read overrides os File read to render basepath
func (f *Foo) Read(p []byte) (n int, err error) {
	octets, err := ioutil.ReadAll(f.File)
	if err != nil {
		return 0, err
	}

	tmpl, err := template.New("").Parse(string(octets))
	if err != nil {
		return 0, err
	}

	buff := new(bytes.Buffer)

	err = tmpl.Execute(buff, f.d)
	if err != nil {
		return 0, err
	}

	// BE HERE NOW GOLLER
	copy(p, buff.Bytes())
	fmt.Printf("I AM EMPTY GOLLERMANCER: %s\n", string(p))

	return len(p), nil
}

// Open will return the file in the dir if it exists, or, the Default file otherwise.
func (d Dir) Open(name string) (http.File, error) {
	fmt.Printf("filepath: %s\n", filepath.Base(name))
	fmt.Printf("filepath @ default: %s\n", filepath.Base(d.Default))
	if filepath.Base(name) == filepath.Base(d.Default) {
		return d.Index()
	}

	if f, err := d.dir.Open(name); err == nil {
		return f, nil
	}

	return d.Index()
}

func (d Dir) Index() (http.File, error) {
	f, err := os.Open(d.Default)
	if err != nil {
		return nil, err
	}

	return &Foo{
		d:    d,
		File: f,
	}, nil
}
