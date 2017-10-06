package server

import (
	"errors"
	"net/url"
)

type selfLinks struct {
	Self string `json:"self"` // Self link mapping to this resource
}

type getExternalLinksResponse struct {
	StatusFeed  *string      `json:"statusFeed,omitempty"` // Location of the a JSON Feed for client's Status page News Feed
	CustomLinks []CustomLink `json:"custom,omitempty"`     // Any custom external links for client's User menu
}

// CustomLink is a handler that returns a custom link to be used in server's routes response, within ExternalLinks
type CustomLink struct {
	Name string `json:"name"`
	URL  string `json:"url"`
}

// NewCustomLinks transforms `--custom-link` CLI flag data or `CUSTOM_LINKS` ENV
// var data into a data structure that the Chronograf client will expect
func NewCustomLinks(links map[string]string) ([]CustomLink, error) {
	customLinks := make([]CustomLink, 0, len(links))
	for name, link := range links {
		if name == "" {
			return nil, errors.New("CustomLink missing key for Name")
		}
		if link == "" {
			return nil, errors.New("CustomLink missing value for URL")
		}
		_, err := url.Parse(link)
		if err != nil {
			return nil, err
		}

		customLink := CustomLink{
			Name: name,
			URL:  link,
		}
		customLinks = append(customLinks, customLink)
	}

	return customLinks, nil
}
