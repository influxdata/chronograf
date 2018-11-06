package semantic

// TvarSet is a set of type variables.
type TvarSet []Tvar

func (s TvarSet) contains(tv Tvar) bool {
	for _, t := range s {
		if tv == t {
			return true
		}
	}
	return false
}

func (a TvarSet) union(b TvarSet) TvarSet {
	union := make(TvarSet, len(a), len(a)+len(b))
	copy(union, a)
	for _, tv := range b {
		if !union.contains(tv) {
			union = append(union, tv)
		}
	}
	return union
}

func (a TvarSet) hasIntersect(b TvarSet) bool {
	for _, tva := range a {
		if b.contains(tva) {
			return true
		}
	}
	return false
}

func (a TvarSet) diff(b TvarSet) TvarSet {
	diff := make(TvarSet, 0, len(a))
	for _, tva := range a {
		if !b.contains(tva) {
			diff = append(diff, tva)
		}
	}
	return diff
}
