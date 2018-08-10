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

func Test_Protoboard_All(t *testing.T) {
	t.Parallel()
	var tests = []struct {
		Existing []chronograf.Protoboard
		Err      error
	}{
		{
			Existing: []chronograf.Protoboard{
				{ID: "1"},
				{ID: "2"},
			},
			Err: nil,
		},
		{
			Existing: []chronograf.Protoboard{},
			Err:      nil,
		},
		{
			Existing: nil,
			Err:      errors.New("Error"),
		},
	}
	for i, test := range tests {
		fp, _ := MockProtoboards(test.Existing, test.Err)
		protoboards, err := fp.All(context.Background())
		if err != test.Err {
			t.Errorf("Test %d: protoboards all error expected: %v; actual: %v", i, test.Err, err)
		}
		if !reflect.DeepEqual(protoboards, test.Existing) {
			t.Errorf("Test %d: Protoboards should be equal; expected %v; actual %v", i, test.Existing, protoboards)
		}
	}
}

func Test_Protoboard_Get(t *testing.T) {
	t.Parallel()
	var tests = []struct {
		Existing []chronograf.Protoboard
		ID       string
		Expected chronograf.Protoboard
		Err      error
	}{
		{
			Existing: []chronograf.Protoboard{
				{ID: "1"},
				{ID: "2"},
			},
			ID: "1",
			Expected: chronograf.Protoboard{
				ID: "1",
			},
			Err: nil,
		},
		{
			Existing: []chronograf.Protoboard{},
			ID:       "1",
			Expected: chronograf.Protoboard{},
			Err:      chronograf.ErrProtoboardNotFound,
		},
		{
			Existing: nil,
			ID:       "1",
			Expected: chronograf.Protoboard{},
			Err:      chronograf.ErrProtoboardNotFound,
		},
	}
	for i, test := range tests {
		fp, _ := MockProtoboards(test.Existing, test.Err)
		protoboard, err := fp.Get(context.Background(), test.ID)
		if err != test.Err {
			t.Errorf("Test %d: Protoboards get error expected: %v; actual: %v", i, test.Err, err)
		}
		if !reflect.DeepEqual(protoboard, test.Expected) {
			t.Errorf("Test %d: Protoboards should be equal; expected %v; actual %v", i, test.Expected, protoboard)
		}
	}
}

type Mock_Protoboard_FileInfo struct {
	name string
}

func (m *Mock_Protoboard_FileInfo) Name() string {
	return m.name
}

func (m *Mock_Protoboard_FileInfo) Size() int64 {
	return 0
}

func (m *Mock_Protoboard_FileInfo) Mode() os.FileMode {
	return 0666
}

func (m *Mock_Protoboard_FileInfo) ModTime() time.Time {
	return time.Now()
}

func (m *Mock_Protoboard_FileInfo) IsDir() bool {
	return false
}

func (m *Mock_Protoboard_FileInfo) Sys() interface{} {
	return nil
}

type Mock_Protoboard_FileInfos []os.FileInfo

func (m Mock_Protoboard_FileInfos) Len() int           { return len(m) }
func (m Mock_Protoboard_FileInfos) Swap(i, j int)      { m[i], m[j] = m[j], m[i] }
func (m Mock_Protoboard_FileInfos) Less(i, j int) bool { return m[i].Name() < m[j].Name() }

type Mock_Protoboard_ID struct {
	id int
}

func (m *Mock_Protoboard_ID) Generate() (string, error) {
	m.id++
	return strconv.Itoa(m.id), nil
}

func MockProtoboards(existing []chronograf.Protoboard, expected error) (filestore.Protoboards, *map[string]chronograf.Protoboard) {
	protoboards := map[string]chronograf.Protoboard{}
	fileName := func(dir string, protoboard chronograf.Protoboard) string {
		return path.Join(dir, protoboard.ID+".json")
	}
	dir := "dir"
	for _, l := range existing {
		protoboards[fileName(dir, l)] = l
	}
	load := func(file string) (chronograf.Protoboard, error) {
		if expected != nil {
			return chronograf.Protoboard{}, expected
		}

		l, ok := protoboards[file]
		if !ok {
			return chronograf.Protoboard{}, chronograf.ErrProtoboardNotFound
		}
		return l, nil
	}

	readDir := func(dirname string) ([]os.FileInfo, error) {
		if expected != nil {
			return nil, expected
		}
		info := []os.FileInfo{}
		for k := range protoboards {
			info = append(info, &Mock_Protoboard_FileInfo{filepath.Base(k)})
		}
		sort.Sort(Mock_Protoboard_FileInfos(info))
		return info, nil
	}

	return filestore.Protoboards{
		Dir:     dir,
		Load:    load,
		ReadDir: readDir,
		IDs: &Mock_Protoboard_ID{
			id: len(existing),
		},
		Logger: clog.New(clog.ParseLevel("debug")),
	}, &protoboards
}
