package filestore

import (
	"context"
	"errors"
	"fmt"
	"io/ioutil"
	"os"
	"path"

	"github.com/hws522/chronograf"
)

// KapExt is the the file extension searched for in the directory for kapacitor files
const KapExt = ".kap"

// Verify Kapacitors implements serverStore interface.
var _ chronograf.ServersStore = (*Kapacitors)(nil)

// Kapacitors are JSON kapacitors stored in the filesystem
type Kapacitors struct {
	Dir     string                                      // Dir is the directory containing the kapacitors.
	ReadDir func(dirname string) ([]os.FileInfo, error) // ReadDir reads the directory named by dirname and returns a list of directory entries sorted by filename.
	Remove  func(name string) error                     // Remove file
	IDs     chronograf.ID                               // IDs generate unique ids for new kapacitors
	Logger  chronograf.Logger
}

// NewKapacitors constructs a kapacitor store wrapping a file system directory
func NewKapacitors(dir string, ids chronograf.ID, logger chronograf.Logger) chronograf.ServersStore {
	return &Kapacitors{
		Dir:     dir,
		ReadDir: ioutil.ReadDir,
		Remove:  os.Remove,
		IDs:     ids,
		Logger:  logger,
	}
}

// All returns all kapacitors from the directory
func (d *Kapacitors) All(ctx context.Context) ([]chronograf.Server, error) {
	files, err := d.ReadDir(d.Dir)
	if err != nil {
		return nil, err
	}

	kapacitors := []chronograf.Server{}
	for _, file := range files {
		if path.Ext(file.Name()) != KapExt {
			continue
		}
		var kapacitor chronograf.Server
		if err := load(path.Join(d.Dir, file.Name()), &kapacitor); err != nil {
			var fmtErr = fmt.Errorf("Error loading kapacitor configuration from %v:\n%v", path.Join(d.Dir, file.Name()), err)
			d.Logger.Error(fmtErr)
			continue // We want to load all files we can.
		} else {
			kapacitors = append(kapacitors, kapacitor)
		}
	}
	return kapacitors, nil
}

// Get returns a kapacitor file from the kapacitor directory
func (d *Kapacitors) Get(ctx context.Context, id int) (chronograf.Server, error) {
	board, file, err := d.idToFile(id)
	if err != nil {
		if err == chronograf.ErrServerNotFound {
			d.Logger.
				WithField("component", "kapacitor").
				WithField("name", file).
				Error("Unable to read file")
		} else if err == chronograf.ErrServerInvalid {
			d.Logger.
				WithField("component", "kapacitor").
				WithField("name", file).
				Error("File is not a kapacitor")
		}
		return chronograf.Server{}, err
	}
	return board, nil
}

// idToFile takes an id and finds the associated filename
func (d *Kapacitors) idToFile(id int) (chronograf.Server, string, error) {
	// Because the entire kapacitor information is not known at this point, we need
	// to try to find the name of the file through matching the ID in the kapacitor
	// content with the ID passed.
	files, err := d.ReadDir(d.Dir)
	if err != nil {
		return chronograf.Server{}, "", err
	}

	for _, f := range files {
		if path.Ext(f.Name()) != KapExt {
			continue
		}
		file := path.Join(d.Dir, f.Name())
		var kapacitor chronograf.Server
		if err := load(file, &kapacitor); err != nil {
			return chronograf.Server{}, "", err
		}
		if kapacitor.ID == id {
			return kapacitor, file, nil
		}
	}

	return chronograf.Server{}, "", chronograf.ErrServerNotFound
}

// Update replaces a kapacitor from the file system directory
func (d *Kapacitors) Update(ctx context.Context, kapacitor chronograf.Server) error {
	board, _, err := d.idToFile(kapacitor.ID)
	if err != nil {
		return err
	}

	if err := d.Delete(ctx, board); err != nil {
		return err
	}
	file := file(d.Dir, kapacitor.Name, KapExt)
	return create(file, kapacitor)
}

// Delete removes a kapacitor file from the directory
func (d *Kapacitors) Delete(ctx context.Context, kapacitor chronograf.Server) error {
	_, file, err := d.idToFile(kapacitor.ID)
	if err != nil {
		return err
	}

	if err := d.Remove(file); err != nil {
		d.Logger.
			WithField("component", "kapacitor").
			WithField("name", file).
			Error("Unable to remove kapacitor:", err)
		return err
	}
	return nil
}

// Add creates a new kapacitor within the directory
func (d *Kapacitors) Add(ctx context.Context, kapacitor chronograf.Server) (chronograf.Server, error) {
	return chronograf.Server{}, errors.New("adding a server to a filestore is not supported")
}
