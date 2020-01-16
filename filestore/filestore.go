// Package filestore provides the ability to read pre-defined resources from
// a specified directory (--canned-path). This also provides a means to make
// updates to certain resources. Adding new resources is not supported as it
// paves the way for too much unexpected behaviors. Filestore is used in
// conjunction with a 'multistore' and is usually tried last. By supporting
// add functionality, a resource may mistakenly be saved to the filesystem
// if the write to the db fails.
//
// Resources that are storable in a file are:
// (CRUD refers to create, read, update, delete. An '_' means not supported)
//    Apps(layouts) - _R__
//    Dashboards    - _RUD
//    Kapacitors    - _RUD
//    Organizations - _R__
//    Protoboards   - _R__
//    Sources       - _RUD
//
// Caution should be taken when editing resources provided via the filestore,
// especially in a distributed environment as unexpected behavior may occur.
package filestore

import (
	"bytes"
	"encoding/json"
	"fmt"
	"html/template"
	"os"
	"path"
	"strings"
)

func create(file string, resource interface{}) error {
	h, err := os.Create(file)
	if err != nil {
		return err
	}
	defer h.Close()

	octets, err := json.MarshalIndent(resource, "    ", "    ")
	if err != nil {
		return err
	}

	_, err = h.Write(octets)
	return err
}

func file(dir, name, ext string) string {
	base := fmt.Sprintf("%s%s", name, ext)
	return path.Join(dir, base)
}

func load(name string, resource interface{}) error {
	octets, err := templatedFromEnv(name)
	if err != nil {
		return fmt.Errorf("resource %s not found", name)
	}

	return json.Unmarshal(octets, resource)
}

var env map[string]string

// templatedFromEnv returns all files templated against environment variables
func templatedFromEnv(filenames ...string) ([]byte, error) {
	return templated(environ(), filenames...)
}

// templated returns all files templated using data
func templated(data interface{}, filenames ...string) ([]byte, error) {
	t, err := template.ParseFiles(filenames...)
	if err != nil {
		return nil, err
	}
	var b bytes.Buffer
	// If a key in the file exists but is not in the data we
	// immediately fail with a missing key error
	err = t.Option("missingkey=error").Execute(&b, data)
	if err != nil {
		return nil, err
	}

	return b.Bytes(), nil
}

// environ returns a map of all environment variables in the running process
func environ() map[string]string {
	if env == nil {
		env = make(map[string]string)
		envVars := os.Environ()
		for _, envVar := range envVars {
			kv := strings.SplitN(envVar, "=", 2)
			if len(kv) != 2 {
				continue
			}
			env[kv[0]] = kv[1]
		}
	}
	return env
}
