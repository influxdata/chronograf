package ui

import (
	"crypto/sha1"
	"embed"
	"encoding/base64"
	"io"
	"io/fs"
	"net/http"
	"regexp"
	"strings"
	"sync"
)

const (
	// Default page to load (upon a miss)
	DefaultPage = "index.html"
	// DefaultPageContentType is the content-type of the DefaultPage
	DefaultPageContentType = "text/html; charset=utf-8"
)

//go:embed build/*
var embeddedFS embed.FS
var buildDir fs.FS
var fileETags sync.Map

//go:embed package.json
var packageJson string
var version string

// init initializes version and buildDir file system
func init() {
	// parse version
	version = ""
	re := regexp.MustCompile(`"version"\s*:\s*"(.*)"`)
	if matches := re.FindStringSubmatch(packageJson); matches != nil {
		version = matches[1]
	}
	// initialize buildDir and default file
	var err error
	if buildDir, err = fs.Sub(embeddedFS, "build"); err != nil {
		panic("no ui/build directory found!")
	}
}

// BindataAssets serves embedded ui assets and also serves its index.html by default
// in order to support single-page react-apps with its own router.
type BindataAssets struct {
}

// fsImpl is a s imple fs.FS implementation that uses the supplied OpenFn function
type fsImpl struct {
	openFn func(path string) (fs.File, error)
}

func (fs *fsImpl) Open(path string) (fs.File, error) {
	return fs.openFn(path)
}

// Handler returns HTTP handler that serves embedded data
func (b *BindataAssets) Handler() http.Handler {
	return b
}

// addCacheHeaders requests an hour of Cache-Control and sets an ETag based on file size and modtime
func addCacheHeaders(name string, headers http.Header) error {
	headers.Set("Cache-Control", "public, max-age=3600")
	headers.Set("X-Frame-Options", "SAMEORIGIN")
	headers.Set("X-XSS-Protection", "1; mode=block")
	headers.Set("X-Content-Type-Options", "nosniff")
	headers.Set("Content-Security-Policy", "script-src 'self'; object-src 'self'")

	// go embed does not include real Stat().ModTime to make ETag computation simple
	// see https://github.com/golang/go/issues/43223
	// as a workaround, compute ETag from file contents cand cache it

	if etag, found := fileETags.Load(name); found {
		headers.Set("ETag", etag.(string))
		return nil
	}
	// compute and store SHA1 digest of file contents as an ETag
	hash := sha1.New()
	if input, err := buildDir.Open(name); err != nil {
		return err
	} else {
		if _, err := io.Copy(hash, input); err != nil {
			return err
		}
		etag := base64.StdEncoding.EncodeToString(hash.Sum(nil))
		fileETags.Store(name, etag)
		headers.Set("ETag", etag)
	}
	return nil
}

// ServeHTTP wraps http.FileServer by returning a default asset if the asset
// doesn't exist.  This supports single-page react-apps with its own
// built-in router.  Additionally, we override the content-type if the
// Default file is used.
func (b *BindataAssets) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	// openFn wraps buidDir.Open in order to setup default HTTP headers
	// it also returns the default file if the file doesn't exist
	openFn := func(name string) (fs.File, error) {
		// If the named asset exists, then return it directly.
		file, err := buildDir.Open(name)
		if err != nil {
			// If this is at / then we just error out so we can return a Directory
			// This directory will then be redirected by go to the /index.html
			if name == "/" || name == "." {
				return nil, err
			}
			// If this is anything other than slash, we just return the default
			// asset.  This default asset will handle the routing.
			// Additionally, because we know we are returning the default asset,
			// we need to set the default asset's content-type.
			w.Header().Set("Content-Type", DefaultPageContentType)
			name = DefaultPage
			defaultFile, err := buildDir.Open(name)
			if err != nil {
				return nil, err
			}
			file = defaultFile
		}
		if err := addCacheHeaders(name, w.Header()); err != nil {
			return nil, err
		}
		// https://github.com/influxdata/chronograf/issues/5565
		// workaround wrong .js content-type on windows
		if strings.HasSuffix(name, ".js") {
			w.Header().Set("Content-Type", "text/javascript")
		}
		return file, nil
	}
	var fs fs.FS = &fsImpl{
		openFn: openFn,
	}
	http.FileServer(http.FS(fs)).ServeHTTP(w, r)
}

// GetVersion returns version of the packed assets
func GetVersion() string {
	return version
}
