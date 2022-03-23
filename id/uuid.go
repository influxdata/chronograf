package id

import (
	"github.com/google/uuid"
	"github.com/influxdata/chronograf"
)

var _ chronograf.ID = &UUID{}

// UUID generates a V4 uuid
type UUID struct{}

// Generate creates a UUID v4 string
func (i *UUID) Generate() (string, error) {
	return uuid.New().String(), nil
}
