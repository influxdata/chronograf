package semantic

// Fresher produces fresh type variables.
type Fresher interface {
	// Fresh produces a new unused type variable.
	Fresh() Tvar
}

func NewFresher() Fresher {
	return new(fresher)
}

type fresher Tvar

func (f *fresher) Fresh() Tvar {
	(*f)++
	return Tvar(*f)
}
