package internal

import (
	"time"

	"github.com/gogo/protobuf/proto"
	"github.com/influxdata/mrfusion"
)

//go:generate protoc --gogo_out=. internal.proto

// MarshalExploration encodes an exploration to binary protobuf format.
func MarshalExploration(e *mrfusion.Exploration) ([]byte, error) {
	return proto.Marshal(&Exploration{
		ID:        int64(e.ID),
		Name:      e.Name,
		UserID:    int64(e.UserID),
		Data:      e.Data,
		CreatedAt: e.CreatedAt.UnixNano(),
		UpdatedAt: e.UpdatedAt.UnixNano(),
		Default:   e.Default,
	})
}

// UnmarshalExploration decodes an exploration from binary protobuf data.
func UnmarshalExploration(data []byte, e *mrfusion.Exploration) error {
	var pb Exploration
	if err := proto.Unmarshal(data, &pb); err != nil {
		return err
	}

	e.ID = mrfusion.ExplorationID(pb.ID)
	e.Name = pb.Name
	e.UserID = mrfusion.UserID(pb.UserID)
	e.Data = pb.Data
	e.CreatedAt = time.Unix(0, pb.CreatedAt).UTC()
	e.UpdatedAt = time.Unix(0, pb.UpdatedAt).UTC()
	e.Default = pb.Default

	return nil
}

// MarshalSource encodes an source to binary protobuf format.
func MarshalSource(s mrfusion.Source) ([]byte, error) {
	return proto.Marshal(&Source{
		ID:       int64(s.ID),
		Name:     s.Name,
		Type:     s.Type,
		Username: s.Username,
		Password: s.Password,
		URLs:     s.URL,
		Default:  s.Default,
	})
}

// UnmarshalSource decodes an source from binary protobuf data.
func UnmarshalSource(data []byte, s *mrfusion.Source) error {
	var pb Source
	if err := proto.Unmarshal(data, &pb); err != nil {
		return err
	}

	s.ID = int(pb.ID)
	s.Name = pb.Name
	s.Type = pb.Type
	s.Username = pb.Username
	s.Password = pb.Password
	s.URL = pb.URLs
	s.Default = pb.Default
	return nil
}
