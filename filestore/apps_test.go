package filestore_test

import (
	"context"
	"errors"
	"os"
	"path"
	"path/filepath"
	"reflect"
	"sort"
	"strconv"
	"testing"
	"time"

	"github.com/influxdata/chronograf"
	"github.com/influxdata/chronograf/filestore"
	clog "github.com/influxdata/chronograf/log"
)

func TestAll(t *testing.T) {
	t.Parallel()
	var tests = []struct {
		Existing []chronograf.Layout
		Err      error
	}{
		{
			Existing: []chronograf.Layout{
				{ID: "1",
					Application: "howdy",
				},
				{ID: "2",
					Application: "doody",
				},
			},
			Err: nil,
		},
		{
			Existing: []chronograf.Layout{},
			Err:      nil,
		},
		{
			Existing: nil,
			Err:      errors.New("Error"),
		},
	}
	for i, test := range tests {
		apps, _ := MockApps(test.Existing, test.Err)
		layouts, err := apps.All(context.Background())
		if err != test.Err {
			t.Errorf("Test %d: apps all error expected: %v; actual: %v", i, test.Err, err)
		}
		if !reflect.DeepEqual(layouts, test.Existing) {
			t.Errorf("Test %d: Layouts should be equal; expected %v; actual %v", i, test.Existing, layouts)
		}
	}
}

func TestGet(t *testing.T) {
	t.Parallel()
	var tests = []struct {
		Existing []chronograf.Layout
		ID       string
		Expected chronograf.Layout
		Err      error
	}{
		{
			Existing: []chronograf.Layout{
				{ID: "1",
					Application: "howdy",
				},
				{ID: "2",
					Application: "doody",
				},
			},
			ID: "1",
			Expected: chronograf.Layout{
				ID:          "1",
				Application: "howdy",
			},
			Err: nil,
		},
		{
			Existing: []chronograf.Layout{},
			ID:       "1",
			Expected: chronograf.Layout{},
			Err:      chronograf.ErrLayoutNotFound,
		},
		{
			Existing: nil,
			ID:       "1",
			Expected: chronograf.Layout{},
			Err:      chronograf.ErrLayoutNotFound,
		},
	}
	for i, test := range tests {
		apps, _ := MockApps(test.Existing, test.Err)
		layout, err := apps.Get(context.Background(), test.ID)
		if err != test.Err {
			t.Errorf("Test %d: Layouts get error expected: %v; actual: %v", i, test.Err, err)
		}
		if !reflect.DeepEqual(layout, test.Expected) {
			t.Errorf("Test %d: Layouts should be equal; expected %v; actual %v", i, test.Expected, layout)
		}
	}
}

type MockFileInfo struct {
	name string
}

func (m *MockFileInfo) Name() string {
	return m.name
}

func (m *MockFileInfo) Size() int64 {
	return 0
}

func (m *MockFileInfo) Mode() os.FileMode {
	return 0666
}

func (m *MockFileInfo) ModTime() time.Time {
	return time.Now()
}

func (m *MockFileInfo) IsDir() bool {
	return false
}

func (m *MockFileInfo) Sys() interface{} {
	return nil
}

type MockFileInfos []os.FileInfo

func (m MockFileInfos) Len() int           { return len(m) }
func (m MockFileInfos) Swap(i, j int)      { m[i], m[j] = m[j], m[i] }
func (m MockFileInfos) Less(i, j int) bool { return m[i].Name() < m[j].Name() }

type MockID struct {
	id int
}

func (m *MockID) Generate() (string, error) {
	m.id++
	return strconv.Itoa(m.id), nil
}

func MockApps(existing []chronograf.Layout, expected error) (filestore.Apps, *map[string]chronograf.Layout) {
	layouts := map[string]chronograf.Layout{}
	fileName := func(dir string, layout chronograf.Layout) string {
		return path.Join(dir, layout.ID+".json")
	}
	dir := "dir"
	for _, l := range existing {
		layouts[fileName(dir, l)] = l
	}
	loadLayout := func(file string) (chronograf.Layout, error) {
		if expected != nil {
			return chronograf.Layout{}, expected
		}

		l, ok := layouts[file]
		if !ok {
			return chronograf.Layout{}, chronograf.ErrLayoutNotFound
		}
		return l, nil
	}

	readDir := func(dirname string) ([]os.FileInfo, error) {
		if expected != nil {
			return nil, expected
		}
		info := []os.FileInfo{}
		for k := range layouts {
			info = append(info, &MockFileInfo{filepath.Base(k)})
		}
		sort.Sort(MockFileInfos(info))
		return info, nil
	}

	return filestore.Apps{
		Dir:     dir,
		Load:    loadLayout,
		ReadDir: readDir,
		IDs: &MockID{
			id: len(existing),
		},
		Logger: clog.New(clog.ParseLevel("debug")),
	}, &layouts
}

type apps struct {
	filestore.Apps
}
