package semantic

import (
	"fmt"
	"sort"
	"strings"

	"github.com/influxdata/flux/ast"
	"github.com/pkg/errors"
)

// SolveConstraints solves the type inference problem defined by the constraints.
func SolveConstraints(cs *Constraints) (TypeSolution, error) {
	s := &Solution{cs: cs}
	err := s.solve()
	if err != nil {
		return nil, err
	}
	return s, nil
}

// Solution implement TypeSolution and solves the unification problem.
type Solution struct {
	cs    *Constraints
	kinds kindsMap
}

func (s *Solution) Fresh() Tvar {
	return s.cs.f.Fresh()
}

func (s *Solution) FreshSolution() TypeSolution {
	return &Solution{
		cs: s.cs.Copy(),
	}
}

// solve uses Robinson flavor unification to solve the constraints.
// Robison unification is the idea that given a constraint that two types are equal, those types are unified.
//
// Unifying two types means to do one of the following:
//  1. Given two primitive types assert the types are the same or report an error.
//  2. Given a type variable and another type record that the type variable now has the given type.
//  3. Recurse into children types of compound types, for example unify the return types of functions.
//
// The unification process has two domains over which it operates.
// The type domain and the kind domain.
// Unifying types occurs as explained above.
// Unifying kinds is the same process except in the kind domain.
// The domains are NOT independent, unifying two types may require that two kinds be unified.
// Similarly unifying two kinds may require that two types be unified.
//
// These two separate domains allow for structural polymorphism among other things.
// Specifically the structure of objects is constrained in the kind domain not the type domain.
// See "Simple Type Inference for Structural Polymorphism" Jacques Garrigue https://caml.inria.fr/pub/papers/garrigue-structural_poly-fool02.pdf for details on this approach.
func (sol *Solution) solve() error {
	// Create substituion
	subst := make(Substitution)
	// Create map of unified kind constraints
	kinds := make(map[Tvar]Kind, len(sol.cs.kindConst))

	// Initialize unified kinds with first kind constraint
	for tv, ks := range sol.cs.kindConst {
		kinds[tv] = ks[0]
	}

	// Unify all kind constraints
	for tvl, ks := range sol.cs.kindConst {
		for _, k := range ks[1:] {
			tvr := subst.ApplyTvar(tvl)
			kind := kinds[tvr]
			s, err := unifyKinds(kinds, tvl, tvr, kind, k)
			if err != nil {
				return err
			}
			subst.Merge(s)
		}
	}

	// Unify all type constraints
	for _, tc := range sol.cs.typeConst {
		l := subst.ApplyType(tc.l)
		r := subst.ApplyType(tc.r)
		s, err := unifyTypes(kinds, l, r)
		if err != nil {
			return errors.Wrapf(err, "type error %v", tc.loc)
		}
		subst.Merge(s)
	}

	// Apply substituion to kind constraints
	sol.kinds = make(map[Tvar]Kind, len(kinds))
	for tv, k := range kinds {
		k = subst.ApplyKind(k)
		tv = subst.ApplyTvar(tv)
		sol.kinds[tv] = k
	}
	// Apply substitution to the type annotations
	for n, ann := range sol.cs.annotations {
		if ann.Type != nil {
			ann.Type = subst.ApplyType(ann.Type)
			sol.cs.annotations[n] = ann
		}
	}
	//log.Println("subst", subst)
	//log.Println("kinds", sol.kinds)
	return nil
}

func (s *Solution) TypeOf(n Node) (Type, error) {
	a, ok := s.cs.annotations[n]
	if !ok {
		return nil, nil
	}
	if a.Err != nil {
		return nil, a.Err
	}
	return a.Type.resolveType(s.kinds)
}

func (s *Solution) PolyTypeOf(n Node) (PolyType, error) {
	a, ok := s.cs.annotations[n]
	if !ok {
		return nil, fmt.Errorf("no type annotation for node %T@%v", n, n.Location())
	}
	if a.Err != nil {
		return nil, a.Err
	}
	if a.Type == nil {
		return nil, fmt.Errorf("node %T@%v has no poly type", n, n.Location())
	}
	return a.Type.resolvePolyType(s.kinds)
}

func (s *Solution) AddConstraint(l, r PolyType) error {
	if l == nil || r == nil {
		return errors.New("cannot add type constraint on nil types")
	}
	s.kinds = nil
	s.cs.AddTypeConst(l, r, ast.SourceLocation{})
	return s.solve()
}

func unifyTypes(kinds map[Tvar]Kind, l, r PolyType) (s Substitution, _ error) {
	//log.Printf("unifyTypes %v == %v", l, r)
	return l.unifyType(kinds, r)
}

func unifyKinds(kinds map[Tvar]Kind, tvl, tvr Tvar, l, r Kind) (Substitution, error) {
	k, s, err := l.unifyKind(kinds, r)
	if err != nil {
		return nil, err
	}
	//log.Printf("unifyKinds %v = %v == %v = %v ==> %v :: %v", tvl, l, tvr, r, k, s)
	kinds[tvr] = k
	if tvl != tvr {
		// The substituion now knows that tvl = tvr
		// No need to keep the kind constraints around for tvl
		delete(kinds, tvl)
	}
	return s, nil
}

func unifyVarAndType(kinds map[Tvar]Kind, tv Tvar, t PolyType) (Substitution, error) {
	if t.occurs(tv) {
		return nil, fmt.Errorf("type var %v occurs in %v creating a cycle", tv, t)
	}
	unifyKindsByType(kinds, tv, t)
	return Substitution{tv: t}, nil
}

func unifyKindsByVar(kinds map[Tvar]Kind, l, r Tvar) (Substitution, error) {
	kl, okl := kinds[l]
	kr, okr := kinds[r]
	switch {
	case okl && okr:
		return unifyKinds(kinds, l, r, kl, kr)
	case okl && !okr:
		kinds[r] = kl
		delete(kinds, l)
	}
	return nil, nil
}

func unifyKindsByType(kinds map[Tvar]Kind, tv Tvar, t PolyType) (Substitution, error) {
	k, ok := kinds[tv]
	if !ok {
		return nil, nil
	}
	switch k.(type) {
	case ObjectKind, ArrayKind:
		_, ok := t.(Tvar)
		if !ok {
			return nil, errors.New("invalid type for kind")
		}
	}
	return nil, nil
}

type kindsMap map[Tvar]Kind

func (kinds kindsMap) String() string {
	var builder strings.Builder
	vars := make([]int, 0, len(kinds))
	for tv := range kinds {
		vars = append(vars, int(tv))
	}
	sort.Ints(vars)
	builder.WriteString("{\n")
	for i, tvi := range vars {
		tv := Tvar(tvi)
		if i != 0 {
			builder.WriteString(",\n")
		}
		fmt.Fprintf(&builder, "%v = %v", tv, kinds[tv])
	}
	builder.WriteString("}")
	return builder.String()
}
