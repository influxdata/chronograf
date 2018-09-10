package execute

import (
	"github.com/influxdata/flux"
	uuid "github.com/satori/go.uuid"
)

// Dataset represents the set of data produced by a transformation.
type Dataset interface {
	Node

	RetractTable(key flux.GroupKey) error
	UpdateProcessingTime(t Time) error
	UpdateWatermark(mark Time) error
	Finish(error)

	SetTriggerSpec(t flux.TriggerSpec)
}

// DataCache holds all working data for a transformation.
type DataCache interface {
	Table(flux.GroupKey) (flux.Table, error)

	ForEach(func(flux.GroupKey))
	ForEachWithContext(func(flux.GroupKey, Trigger, TableContext))

	DiscardTable(flux.GroupKey)
	ExpireTable(flux.GroupKey)

	SetTriggerSpec(t flux.TriggerSpec)
}

type AccumulationMode int

const (
	DiscardingMode AccumulationMode = iota
	AccumulatingMode
	AccumulatingRetractingMode
)

type DatasetID uuid.UUID

func (id DatasetID) String() string {
	return uuid.UUID(id).String()
}

var ZeroDatasetID DatasetID

func (id DatasetID) IsZero() bool {
	return id == ZeroDatasetID
}

type dataset struct {
	id DatasetID

	ts      []Transformation
	accMode AccumulationMode

	watermark      Time
	processingTime Time

	cache DataCache
}

func NewDataset(id DatasetID, accMode AccumulationMode, cache DataCache) *dataset {
	return &dataset{
		id:      id,
		accMode: accMode,
		cache:   cache,
	}
}

func (d *dataset) AddTransformation(t Transformation) {
	d.ts = append(d.ts, t)
}

func (d *dataset) SetTriggerSpec(spec flux.TriggerSpec) {
	d.cache.SetTriggerSpec(spec)
}

func (d *dataset) UpdateWatermark(mark Time) error {
	d.watermark = mark
	if err := d.evalTriggers(); err != nil {
		return err
	}
	for _, t := range d.ts {
		if err := t.UpdateWatermark(d.id, mark); err != nil {
			return err
		}
	}
	return nil
}

func (d *dataset) UpdateProcessingTime(time Time) error {
	d.processingTime = time
	if err := d.evalTriggers(); err != nil {
		return err
	}
	for _, t := range d.ts {
		if err := t.UpdateProcessingTime(d.id, time); err != nil {
			return err
		}
	}
	return nil
}

func (d *dataset) evalTriggers() (err error) {
	d.cache.ForEachWithContext(func(key flux.GroupKey, trigger Trigger, bc TableContext) {
		if err != nil {
			// Skip the rest once we have encountered an error
			return
		}
		c := TriggerContext{
			Table:                 bc,
			Watermark:             d.watermark,
			CurrentProcessingTime: d.processingTime,
		}

		if trigger.Triggered(c) {
			err = d.triggerTable(key)
		}
		if trigger.Finished() {
			d.expireTable(key)
		}
	})
	return err
}

func (d *dataset) triggerTable(key flux.GroupKey) error {
	b, err := d.cache.Table(key)
	if err != nil {
		return err
	}
	b.RefCount(len(d.ts))
	switch d.accMode {
	case DiscardingMode:
		for _, t := range d.ts {
			if err := t.Process(d.id, b); err != nil {
				return err
			}
		}
		d.cache.DiscardTable(key)
	case AccumulatingRetractingMode:
		for _, t := range d.ts {
			if err := t.RetractTable(d.id, b.Key()); err != nil {
				return err
			}
		}
		fallthrough
	case AccumulatingMode:
		for _, t := range d.ts {
			if err := t.Process(d.id, b); err != nil {
				return err
			}
		}
	}
	return nil
}

func (d *dataset) expireTable(key flux.GroupKey) {
	d.cache.ExpireTable(key)
}

func (d *dataset) RetractTable(key flux.GroupKey) error {
	d.cache.DiscardTable(key)
	for _, t := range d.ts {
		if err := t.RetractTable(d.id, key); err != nil {
			return err
		}
	}
	return nil
}

func (d *dataset) Finish(err error) {
	if err == nil {
		// Only trigger tables we if we not finishing because of an error.
		d.cache.ForEach(func(bk flux.GroupKey) {
			if err != nil {
				return
			}
			err = d.triggerTable(bk)
			d.cache.ExpireTable(bk)
		})
	}
	for _, t := range d.ts {
		t.Finish(d.id, err)
	}
}
