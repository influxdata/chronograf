package semantic

import "strings"

// LabelSet is a set of string labels.
type LabelSet []string

// allLabels is a sentinal values indicating the set is the infinite set of all possible string labels.
const allLabels = "-all-"

// AllLabels returns a label set that represents the infinite set of all possible string labels.
func AllLabels() LabelSet {
	return LabelSet{allLabels}
}

func (s LabelSet) String() string {
	if s.isAllLabels() {
		return "L"
	}
	if len(s) == 0 {
		return "∅"
	}
	var builder strings.Builder
	builder.WriteString("(")
	for i, l := range s {
		if i != 0 {
			builder.WriteString(", ")
		}
		builder.WriteString(l)
	}
	builder.WriteString(")")
	return builder.String()
}

func (s LabelSet) isAllLabels() bool {
	return len(s) == 1 && s[0] == allLabels
}

func (s LabelSet) contains(l string) bool {
	for _, lbl := range s {
		if l == lbl {
			return true
		}
	}
	return false
}
func (s LabelSet) remove(l string) LabelSet {
	filtered := make(LabelSet, 0, len(s))
	for _, lbl := range s {
		if l != lbl {
			filtered = append(filtered, lbl)
		}
	}
	return filtered
}

func (s LabelSet) union(o LabelSet) LabelSet {
	if s.isAllLabels() {
		return s
	}
	union := make(LabelSet, len(s), len(s)+len(o))
	copy(union, s)
	for _, l := range o {
		if !union.contains(l) {
			union = append(union, l)
		}
	}
	return union
}

func (s LabelSet) intersect(o LabelSet) LabelSet {
	if s.isAllLabels() {
		return o
	}
	if o.isAllLabels() {
		return s
	}
	intersect := make(LabelSet, 0, len(s))
	for _, l := range s {
		if o.contains(l) {
			intersect = append(intersect, l)
		}
	}
	return intersect
}

func (a LabelSet) isSuperSet(b LabelSet) bool {
	if a.isAllLabels() {
		return true
	}
	if b.isAllLabels() {
		return false
	}
	for _, l := range b {
		if !a.contains(l) {
			return false
		}
	}
	return true
}

func (a LabelSet) diff(b LabelSet) LabelSet {
	if a.isAllLabels() {
		return a
	}
	diff := make(LabelSet, 0, len(a))
	for _, l := range a {
		if !b.contains(l) {
			diff = append(diff, l)
		}
	}
	return diff
}

func (a LabelSet) equal(b LabelSet) bool {
	if a.isAllLabels() && b.isAllLabels() {
		return true
	}
	if a.isAllLabels() && !b.isAllLabels() ||
		b.isAllLabels() && !a.isAllLabels() {
		return false
	}
	if len(a) != len(b) {
		return false
	}
	for _, l := range a {
		if !b.contains(l) {
			return false
		}
	}
	return true
}

func (s LabelSet) copy() LabelSet {
	c := make(LabelSet, len(s))
	copy(c, s)
	return c
}
