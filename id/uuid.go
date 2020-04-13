package id

import (
	"github.com/influxdata/chronograf"
	"github.com/google/uuid"
)

var _ chronograf.ID = &UUID{}

// UUID generates a V4 uuid
type UUID struct{}

// Generate creates a UUID v4 string
func (i *UUID) Generate() (string, error) {
	return uuid.New().String(), nil
}
