package server

import (
	"bytes"
	"errors"
	"io"
	"net/http"
	"path"
)

var errReaderBodyTooLarge = errors.New("reader request body too large")

func location(w http.ResponseWriter, self string) {
	w.Header().Add("Location", self)
}

// hsts add HTTP Strict Transport Security header with a max-age of two years
// Inspired from https://blog.bracebin.com/achieving-perfect-ssl-labs-score-with-go
func hsts(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Add("Strict-Transport-Security", "max-age=63072000; includeSubDomains")
		next.ServeHTTP(w, r)
	})
}

// version handler adds X-Chronograf-Version header to responses
func version(version string, h http.Handler) http.Handler {
	fn := func(w http.ResponseWriter, r *http.Request) {
		w.Header().Add("X-Chronograf-Version", version)
		h.ServeHTTP(w, r)
	}
	return http.HandlerFunc(fn)
}

// logout chooses the correct provider logout route and redirects to it
func logout(nextURL, basepath string, routes AuthRoutes) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()
		principal, err := getPrincipal(ctx)
		if err != nil {
			http.Redirect(w, r, path.Join(basepath, nextURL), http.StatusTemporaryRedirect)
			return
		}
		route, ok := routes.Lookup(principal.Issuer)
		if !ok {
			http.Redirect(w, r, path.Join(basepath, nextURL), http.StatusTemporaryRedirect)
			return
		}
		http.Redirect(w, r, route.Logout, http.StatusTemporaryRedirect)
	}
}

type readCloser struct {
	io.Reader
	io.Closer
}

// readAndRestoreBodyWithLimit reads up to maxBytes+1, restores r.Body for downstream
// consumers, and returns errReaderBodyTooLarge if the limit is exceeded.
func readAndRestoreBodyWithLimit(r *http.Request, maxBytes int64) ([]byte, error) {
	originalBody := r.Body
	body, err := io.ReadAll(io.LimitReader(originalBody, maxBytes+1))
	if err != nil {
		return nil, err
	}

	// Preserve full stream and preserve close semantics of original body.
	r.Body = &readCloser{
		Reader: io.MultiReader(bytes.NewReader(body), originalBody),
		Closer: originalBody,
	}

	if int64(len(body)) > maxBytes {
		return nil, errReaderBodyTooLarge
	}

	return body, nil
}
