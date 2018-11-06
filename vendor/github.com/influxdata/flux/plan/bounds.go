package plan

import "github.com/influxdata/flux/values"

// EmptyBounds is a time range containing only a single point
var EmptyBounds = &Bounds{
	Start: values.Time(0),
	Stop:  values.Time(0),
}

// Bounds is a range of time
type Bounds struct {
	Start values.Time
	Stop  values.Time
}

// BoundsAwareProcedureSpec is any procedure
// that modifies the time bounds of its data.
type BoundsAwareProcedureSpec interface {
	TimeBounds(predecessorBounds *Bounds) *Bounds
}

// ComputeBounds computes the time bounds for a
// plan node from the bounds of its predecessors.
func ComputeBounds(node PlanNode) error {
	var bounds *Bounds

	for _, pred := range node.Predecessors() {

		if pred.Bounds() != nil && bounds == nil {
			bounds = pred.Bounds()
		}
		if pred.Bounds() != nil && bounds != nil {
			bounds = bounds.Union(pred.Bounds())
		}
	}

	if s, ok := node.ProcedureSpec().(BoundsAwareProcedureSpec); ok {
		bounds = s.TimeBounds(bounds)
	}
	node.SetBounds(bounds)
	return nil
}

// IsEmpty reports whether the given bounds contain at most a single point
func (b *Bounds) IsEmpty() bool {
	return b.Start >= b.Stop
}

// Contains reports whether a given time is contained within the time range
func (b *Bounds) Contains(t values.Time) bool {
	return t >= b.Start && t < b.Stop
}

// Overlaps reports whether two given bounds have overlapping time ranges
func (b *Bounds) Overlaps(o *Bounds) bool {
	return b.Contains(o.Start) ||
		(b.Contains(o.Stop) && o.Stop > b.Start) ||
		o.Contains(b.Start)
}

// Union returns the smallest bounds which contain both input bounds.
// It returns empty bounds if one of the input bounds are empty.
func (b *Bounds) Union(o *Bounds) *Bounds {
	if b.IsEmpty() || o.IsEmpty() {
		return EmptyBounds
	}
	u := new(Bounds)

	u.Start = b.Start
	if o.Start < b.Start {
		u.Start = o.Start
	}

	u.Stop = b.Stop
	if o.Stop > b.Stop {
		u.Stop = o.Stop
	}

	return u
}

// Intersect returns the intersection of two bounds.
// It returns empty bounds if one of the input bounds are empty.
func (b *Bounds) Intersect(o *Bounds) *Bounds {
	if b.IsEmpty() || o.IsEmpty() || !b.Overlaps(o) {
		return EmptyBounds
	}
	i := new(Bounds)

	i.Start = b.Start
	if o.Start > b.Start {
		i.Start = o.Start
	}

	i.Stop = b.Stop
	if o.Stop < b.Stop {
		i.Stop = o.Stop
	}

	return i
}

// Shift moves the start and stop values of a time range by a specified duration
func (b *Bounds) Shift(d values.Duration) *Bounds {
	return &Bounds{
		Start: b.Start.Add(d),
		Stop:  b.Stop.Add(d),
	}
}
