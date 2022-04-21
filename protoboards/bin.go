package protoboards

import (
	"context"
	"embed"
	"encoding/json"
	"fmt"

	"github.com/influxdata/chronograf"
)

//go:embed *.json
var content embed.FS

// BinProtoboardsStore represents a embedded protoboards store
type BinProtoboardsStore struct {
	Logger chronograf.Logger
}

// All returns the set of all protoboards
func (s *BinProtoboardsStore) All(ctx context.Context) ([]chronograf.Protoboard, error) {
	dirEntries, _ := content.ReadDir(".")
	protoboards := make([]chronograf.Protoboard, len(dirEntries))
	for i, dirEntry := range dirEntries {
		name := dirEntry.Name()
		octets, err := content.ReadFile(name)
		if err != nil {
			s.Logger.
				WithField("component", "protoboards").
				WithField("name", name).
				Error("Invalid protoboard: ", err)
			return nil, chronograf.ErrProtoboardInvalid
		}

		var protoboard chronograf.Protoboard
		if err = json.Unmarshal(octets, &protoboard); err != nil {
			s.Logger.
				WithField("component", "protoboards").
				WithField("name", name).
				Error("Unable to read protoboard:", err)
			return nil, chronograf.ErrProtoboardInvalid
		}
		protoboards[i] = protoboard
	}

	return protoboards, nil
}

// Add is not support by BinProtoboardsStore
func (s *BinProtoboardsStore) Add(ctx context.Context, protoboard chronograf.Protoboard) (chronograf.Protoboard, error) {
	return chronograf.Protoboard{}, fmt.Errorf("Add to BinProtoboardsStore not supported")
}

// Delete is not support by BinProtoboardsStore
func (s *BinProtoboardsStore) Delete(ctx context.Context, protoboard chronograf.Protoboard) error {
	return fmt.Errorf("Delete to BinProtoboardsStore not supported")
}

// Get retrieves protoboard if `ID` exists.
func (s *BinProtoboardsStore) Get(ctx context.Context, ID string) (chronograf.Protoboard, error) {
	protoboards, err := s.All(ctx)
	if err != nil {
		s.Logger.
			WithField("component", "protoboards").
			WithField("name", ID).
			Error("Invalid protoboard: ", err)
		return chronograf.Protoboard{}, chronograf.ErrProtoboardInvalid
	}

	for _, protoboard := range protoboards {
		if protoboard.ID == ID {
			return protoboard, nil
		}
	}

	s.Logger.
		WithField("component", "protoboards").
		WithField("name", ID).
		Error("protoboard not found")
	return chronograf.Protoboard{}, chronograf.ErrProtoboardNotFound
}

// Update not supported
func (s *BinProtoboardsStore) Update(ctx context.Context, protoboard chronograf.Protoboard) error {
	return fmt.Errorf("Update to BinProtoboardsStore not supported")
}
