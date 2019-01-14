package fastwalk

import (
	"io/ioutil"
	"os"
	"path/filepath"
	"testing"
)

func TestFastWalk(t *testing.T) {
	var tmpdir string
	var err error

	if tmpdir, err = ioutil.TempDir("", "zglob"); err != nil {
		t.Fatal(err)
	}
	defer os.RemoveAll(tmpdir)

	if err = os.Chdir(tmpdir); err != nil {
		t.Fatal(err)
	}

	os.MkdirAll(filepath.Join(tmpdir, "foo/bar/baz"), 0755)
	ioutil.WriteFile(filepath.Join(tmpdir, "foo/bar/baz.txt"), []byte{}, 0644)
	ioutil.WriteFile(filepath.Join(tmpdir, "foo/bar/baz/noo.txt"), []byte{}, 0644)

	cases := []struct {
		path      string
		dir       bool
		triggered bool
	}{
		{path: "foo/bar", dir: true, triggered: false},
		{path: "foo/bar/baz", dir: true, triggered: false},
		{path: "foo/bar/baz.txt", dir: false, triggered: false},
		{path: "foo/bar/baz/noo.txt", dir: false, triggered: false},
	}

	for i, tt := range cases {
		err = FastWalk(tt.path, func(path string, mode os.FileMode) error {
			if path != tt.path {
				return nil
			}

			if tt.dir != mode.IsDir() {
				t.Errorf("expected path %q to be: dir:%v, but got dir:%v", tt.path, tt.dir, mode.IsDir())
			}
			cases[i].triggered = true
			return nil
		})
		if err != nil {
			t.Errorf("error running FastWalk on %q: %v", tt.path, err)
			continue
		}

		if !cases[i].triggered {
			t.Errorf("expected %q to be triggered, but got %v", tt.path, cases[i].triggered)
		}
	}
}
