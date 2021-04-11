package filestore

import (
	"context"
	"encoding/json"
	"io/ioutil"
	"os"
	"path"

	"github.com/hws522/chronograf"
)

// AppExt is the the file extension searched for in the directory for layout files
const AppExt = ".json"

// Verify apps (layouts) implements layoutsStore interface.
var _ chronograf.LayoutsStore = (*Apps)(nil)

// Apps are canned JSON layouts.  Implements LayoutsStore.
type Apps struct {
	Dir     string                                      // Dir is the directory contained the pre-canned applications.
	Load    func(string) (chronograf.Layout, error)     // Load loads string name and return a Layout
	ReadDir func(dirname string) ([]os.FileInfo, error) // ReadDir reads the directory named by dirname and returns a list of directory entries sorted by filename.
	IDs     chronograf.ID                               // IDs generate unique ids for new application layouts
	Logger  chronograf.Logger
}

// NewApps constructs a layout store wrapping a file system directory
func NewApps(dir string, ids chronograf.ID, logger chronograf.Logger) chronograf.LayoutsStore {
	return &Apps{
		Dir:     dir,
		Load:    loadFile,
		ReadDir: ioutil.ReadDir,
		IDs:     ids,
		Logger:  logger,
	}
}

func loadFile(name string) (chronograf.Layout, error) {
	octets, err := ioutil.ReadFile(name)
	if err != nil {
		return chronograf.Layout{}, chronograf.ErrLayoutNotFound
	}

	var layout chronograf.Layout
	if err = json.Unmarshal(octets, &layout); err != nil {
		return chronograf.Layout{}, chronograf.ErrLayoutInvalid
	}

	return layout, nil
}

// All returns all layouts from the directory
func (a *Apps) All(ctx context.Context) ([]chronograf.Layout, error) {
	files, err := a.ReadDir(a.Dir)
	if err != nil {
		return nil, err
	}

	layouts := []chronograf.Layout{}
	for _, file := range files {
		if path.Ext(file.Name()) != AppExt {
			continue
		}
		if layout, err := a.Load(path.Join(a.Dir, file.Name())); err != nil {
			continue // We want to load all files we can.
		} else {
			layouts = append(layouts, layout)
		}
	}
	return layouts, nil
}

// Get returns an app file from the layout directory
func (a *Apps) Get(ctx context.Context, ID string) (chronograf.Layout, error) {
	l, file, err := a.idToFile(ID)
	if err != nil {
		return chronograf.Layout{}, err
	}

	if err != nil {
		if err == chronograf.ErrLayoutNotFound {
			a.Logger.
				WithField("component", "apps").
				WithField("name", file).
				Error("Unable to read file")
		} else if err == chronograf.ErrLayoutInvalid {
			a.Logger.
				WithField("component", "apps").
				WithField("name", file).
				Error("File is not a layout")
		}
		return chronograf.Layout{}, err
	}
	return l, nil
}

// idToFile takes an id and finds the associated filename
func (a *Apps) idToFile(ID string) (chronograf.Layout, string, error) {
	// Because the entire layout information is not known at this point, we need
	// to try to find the name of the file through matching the ID in the layout
	// content with the ID passed.
	files, err := a.ReadDir(a.Dir)
	if err != nil {
		return chronograf.Layout{}, "", err
	}

	for _, f := range files {
		if path.Ext(f.Name()) != AppExt {
			continue
		}
		file := path.Join(a.Dir, f.Name())
		layout, err := a.Load(file)
		if err != nil {
			return chronograf.Layout{}, "", err
		}
		if layout.ID == ID {
			return layout, file, nil
		}
	}

	return chronograf.Layout{}, "", chronograf.ErrLayoutNotFound
}
