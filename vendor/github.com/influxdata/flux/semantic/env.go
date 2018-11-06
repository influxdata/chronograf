package semantic

// Env is a type environment mapping identifiers in scope to their type schemes.
type Env struct {
	parent *Env
	m      map[string]Scheme
}

func NewEnv() *Env {
	return &Env{
		m: make(map[string]Scheme),
	}
}

// LocalLookup search for the identifier in the local scope only, it does not recurse to parents.
func (e *Env) LocalLookup(ident string) (Scheme, bool) {
	s, ok := e.m[ident]
	return s, ok
}

// Lookup searchs for the closest identifier in scope.
func (e *Env) Lookup(ident string) (Scheme, bool) {
	s, ok := e.m[ident]
	if ok {
		return s, true
	}
	if e.parent != nil {
		return e.parent.Lookup(ident)
	}
	return Scheme{}, false
}

// Set writes the scheme to the scope with the identifier.
func (e *Env) Set(ident string, s Scheme) {
	e.m[ident] = s
}

// Nest creates a child env.
func (e *Env) Nest() *Env {
	n := NewEnv()
	n.parent = e
	return n
}

// freeVars reports all free variables in the env.
func (e *Env) freeVars(c *Constraints) TvarSet {
	var ftv TvarSet
	if e == nil {
		return ftv
	}
	for _, s := range e.m {
		ftv = ftv.union(s.freeVars(c))
	}
	if e.parent != nil {
		return ftv.union(e.parent.freeVars(c))
	}
	return ftv
}

// RangeSet updates the env recursing through parents.
func (e *Env) RangeSet(f func(k string, v Scheme) Scheme) {
	for k, v := range e.m {
		e.m[k] = f(k, v)
	}
	if e.parent != nil {
		e.parent.RangeSet(f)
	}
}
