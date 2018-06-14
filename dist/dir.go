package dist

import (
	"html/template"
	"io/ioutil"
	"net/http"
	"os"
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

// Open will return the file in the dir if it exists, or, the Default file otherwise.
func (d Dir) Open(name string) (http.File, error) {
	f, err := d.dir.Open(name)
	if err != nil {
		f, err = os.Open(d.Default)
		if err != nil {
			return nil, err
		}

		octets, err := ioutil.ReadAll(f)
		if err != nil {
			return nil, err
		}

		tmpl, err := template.New("").Parse(string(octets))
		if err != nil {
			return nil, err
		}

		err = tmpl.Execute(out, data)

		return f, nil
	}
	return f, err
}
