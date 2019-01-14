package semantic

import (
	"fmt"
	"strings"

	"github.com/influxdata/flux/ast"
	"github.com/pkg/errors"
)

// GenerateConstraints walks the graph and generates constraints between type vairables provided in the annotations.
func GenerateConstraints(node Node, annotator Annotator, importer Importer) (*Constraints, error) {
	if importer == nil {
		importer = noImporter{}
	}
	cg := ConstraintGenerator{
		cs: &Constraints{
			f:           annotator.f,
			annotations: annotator.annotations,
			kindConst:   make(map[Tvar][]Kind),
		},
		env:      NewEnv(),
		err:      new(error),
		importer: importer,
	}
	Walk(NewScopedVisitor(cg), node)
	//log.Println("GenerateConstraints", cg.cs)
	return cg.cs, *cg.err
}

// Importer produces a package given an import path.
type Importer interface {
	Import(path string) (Package, bool)
}

type noImporter struct{}

func (noImporter) Import(string) (Package, bool) {
	return Package{}, false
}

// ConstraintGenerator implements NestingVisitor and generates constraints as it walks the graph.
type ConstraintGenerator struct {
	cs       *Constraints
	env      *Env
	err      *error
	importer Importer
}

// Nest nests the internal type environment to obey scoping rules.
func (v ConstraintGenerator) Nest() NestingVisitor {
	return ConstraintGenerator{
		cs:       v.cs,
		env:      v.env.Nest(),
		err:      v.err,
		importer: v.importer,
	}
}

// Visit visits each node, the algorithm is depth first so nothing is performed in Visit except for an error check.
func (v ConstraintGenerator) Visit(node Node) Visitor {
	if *v.err != nil {
		return nil
	}
	return v
}

// Done visits nodes after all children of the node have been visited.
func (v ConstraintGenerator) Done(node Node) {
	a := v.cs.annotations[node]
	a.Type, a.Err = v.typeof(node)
	if a.Type != nil {
		v.cs.annotations[node] = a
		if !a.Var.Equal(a.Type) {
			v.cs.AddTypeConst(a.Var, a.Type, node.Location())
		}
	}
	a.Err = errors.Wrapf(a.Err, "type error %v", node.Location())
	//log.Printf("typeof %T@%v %v %v %v", node, node.Location(), a.Var, a.Type, a.Err)
	if *v.err == nil && a.Err != nil {
		*v.err = a.Err
	}
}

// lookup returns the poly type of the visited node.
func (v ConstraintGenerator) lookup(n Node) (PolyType, error) {
	a, ok := v.cs.annotations[n]
	if !ok {
		return nil, fmt.Errorf("no annotation found for %T@%v", n, n.Location())
	}
	if a.Type == nil {
		return nil, fmt.Errorf("no type annotation found for %T@%v", n, n.Location())
	}
	return a.Type, a.Err
}

// scheme produces a type scheme from a poly type, this includes the generalize step.
func (v ConstraintGenerator) scheme(t PolyType) Scheme {
	ftv := t.freeVars(v.cs).diff(v.env.freeVars(v.cs))
	return Scheme{
		T:    t,
		Free: ftv,
	}
}

// typeof determines the poly type of a node.
func (v ConstraintGenerator) typeof(n Node) (PolyType, error) {
	nodeVar := v.cs.annotations[n].Var
	switch n := n.(type) {
	case *ImportDeclaration:
		pkg, ok := v.importer.Import(n.Path.Value)
		if !ok {
			return nil, fmt.Errorf("unknown import path: %q", n.Path.Value)
		}
		// Do not trust imported type variables,
		// substitute them with fresh vars.
		t := v.freshType(pkg.Type)
		t = v.applyKindConstraints(t)

		// Determine import identifier
		if n.As != nil {
			pkg.Name = n.As.Name
		}

		v.constrainExistingIdent(pkg.Name, t, n.Location())

		scheme := v.scheme(t)
		v.env.Set(pkg.Name, scheme)
		return nil, nil
	case *ExternalVariableAssignment:
		// Do not trust external type variables,
		// substitute them with fresh vars.
		t := v.freshType(n.ExternType)
		t = v.applyKindConstraints(t)

		v.constrainExistingIdent(n.Identifier.Name, t, n.Location())

		scheme := v.scheme(t)
		v.env.Set(n.Identifier.Name, scheme)
		return nil, nil
	case *NativeVariableAssignment:
		t, err := v.lookup(n.Init)
		if err != nil {
			return nil, err
		}

		v.constrainExistingIdent(n.Identifier.Name, t, n.Location())

		scheme := v.scheme(t)
		v.env.Set(n.Identifier.Name, scheme)
		return nil, nil
	case *IdentifierExpression:
		scheme, ok := v.env.Lookup(n.Name)
		if !ok {
			return nil, fmt.Errorf("undefined identifier %q", n.Name)
		}
		t := v.cs.Instantiate(scheme, n.Location())
		return t, nil
	case *ReturnStatement:
		return v.lookup(n.Argument)
	case *Block:
		return v.lookup(n.ReturnStatement())
	case *BinaryExpression:
		l, err := v.lookup(n.Left)
		if err != nil {
			return nil, err
		}
		r, err := v.lookup(n.Right)
		if err != nil {
			return nil, err
		}

		switch n.Operator {
		case
			ast.AdditionOperator,
			ast.SubtractionOperator,
			ast.MultiplicationOperator,
			ast.DivisionOperator:
			v.cs.AddTypeConst(l, r, n.Location())
			return l, nil
		case
			ast.GreaterThanEqualOperator,
			ast.LessThanEqualOperator,
			ast.GreaterThanOperator,
			ast.LessThanOperator,
			ast.NotEqualOperator,
			ast.EqualOperator:
			return Bool, nil
		case
			ast.RegexpMatchOperator,
			ast.NotRegexpMatchOperator:
			v.cs.AddTypeConst(l, String, n.Location())
			v.cs.AddTypeConst(r, Regexp, n.Location())
			return Bool, nil
		default:
			return nil, fmt.Errorf("unsupported binary operator %v", n.Operator)
		}
	case *LogicalExpression:
		l, err := v.lookup(n.Left)
		if err != nil {
			return nil, err
		}
		r, err := v.lookup(n.Right)
		if err != nil {
			return nil, err
		}
		v.cs.AddTypeConst(l, Bool, n.Location())
		v.cs.AddTypeConst(r, Bool, n.Location())
		return Bool, nil
	case *UnaryExpression:
		t, err := v.lookup(n.Argument)
		if err != nil {
			return nil, err
		}
		switch n.Operator {
		case ast.NotOperator:
			v.cs.AddTypeConst(t, Bool, n.Location())
			return Bool, nil

		}
		return t, nil
	case *FunctionExpression:
		var parameters map[string]PolyType
		var required LabelSet
		var pipeArgument string
		if n.Block.Parameters != nil {
			if n.Block.Parameters.Pipe != nil {
				pipeArgument = n.Block.Parameters.Pipe.Name
			}
			parameters = make(map[string]PolyType, len(n.Block.Parameters.List))
			required = make([]string, 0, len(parameters))
			for _, param := range n.Block.Parameters.List {
				t, err := v.lookup(param)
				if err != nil {
					return nil, err
				}
				isPipe := param.Key.Name == pipeArgument
				parameters[param.Key.Name] = t
				if isPipe {
					parameters[pipeLabel] = t
				}
				hasDefault := false
				if n.Defaults != nil {
					for _, p := range n.Defaults.Properties {
						if p.Key.Key() == param.Key.Name {
							hasDefault = true
							dt, err := v.lookup(p)
							if err != nil {
								return nil, err
							}
							v.cs.AddTypeConst(t, dt, p.Location())
							break
						}
					}
				}
				if !hasDefault && !isPipe {
					required = append(required, param.Key.Name)
				}
			}
		}
		ret, err := v.lookup(n.Block)
		if err != nil {
			return nil, err
		}
		return function{
			parameters:   parameters,
			required:     required,
			ret:          ret,
			pipeArgument: pipeArgument,
		}, nil
	case *FunctionParameter:
		v.env.Set(n.Key.Name, Scheme{T: nodeVar})
		return nodeVar, nil
	case *FunctionBlock:
		return v.lookup(n.Body)
	case *CallExpression:
		typ, err := v.lookup(n.Callee)
		if err != nil {
			return nil, err
		}
		parameters := make(map[string]PolyType, len(n.Arguments.Properties))
		required := make([]string, 0, len(parameters))
		for _, arg := range n.Arguments.Properties {
			t, err := v.lookup(arg.Value)
			if err != nil {
				return nil, err
			}
			parameters[arg.Key.Key()] = t
			required = append(required, arg.Key.Key())
		}
		if n.Pipe != nil {
			t, err := v.lookup(n.Pipe)
			if err != nil {
				return nil, err
			}
			parameters[pipeLabel] = t
		}
		ft := function{
			parameters: parameters,
			required:   required,
			ret:        v.cs.f.Fresh(),
		}
		v.cs.AddTypeConst(typ, ft, n.Location())
		return ft.ret, nil
	case *ObjectExpression:
		properties := make(map[string]PolyType, len(n.Properties))
		upper := make([]string, 0, len(properties))
		for _, field := range n.Properties {
			t, err := v.lookup(field.Value)
			if err != nil {
				return nil, err
			}
			properties[field.Key.Key()] = t
			upper = append(upper, field.Key.Key())
		}
		v.cs.AddKindConst(nodeVar, ObjectKind{
			properties: properties,
			lower:      nil,
			upper:      upper,
		})
		return nodeVar, nil
	case *Property:
		return v.lookup(n.Value)
	case *MemberExpression:
		ptv := v.cs.f.Fresh()
		t, err := v.lookup(n.Object)
		if err != nil {
			return nil, err
		}
		tv, ok := t.(Tvar)
		if !ok {
			return nil, errors.New("member object must be a type variable")
		}
		v.cs.AddKindConst(tv, ObjectKind{
			properties: map[string]PolyType{n.Property: ptv},
			lower:      LabelSet{n.Property},
			upper:      AllLabels(),
		})
		return ptv, nil
	case *IndexExpression:
		ptv := v.cs.f.Fresh()
		t, err := v.lookup(n.Array)
		if err != nil {
			return nil, err
		}
		tv, ok := t.(Tvar)
		if !ok {
			return nil, errors.New("array must be a type variable")
		}
		idx, err := v.lookup(n.Index)
		if err != nil {
			return nil, err
		}
		v.cs.AddKindConst(tv, ArrayKind{ptv})
		v.cs.AddTypeConst(idx, Int, n.Index.Location())
		return ptv, nil
	case *ArrayExpression:
		elt := v.cs.f.Fresh()
		at := array{elt}
		for _, el := range n.Elements {
			t, err := v.lookup(el)
			if err != nil {
				return nil, err
			}
			v.cs.AddTypeConst(t, elt, el.Location())
		}
		v.cs.AddKindConst(nodeVar, ArrayKind{at.typ})
		v.cs.AddTypeConst(nodeVar, at, n.Location())
		return nodeVar, nil
	case *StringLiteral:
		return String, nil
	case *IntegerLiteral:
		return Int, nil
	case *UnsignedIntegerLiteral:
		return UInt, nil
	case *FloatLiteral:
		return Float, nil
	case *BooleanLiteral:
		return Bool, nil
	case *DateTimeLiteral:
		return Time, nil
	case *DurationLiteral:
		return Duration, nil
	case *RegexpLiteral:
		return Regexp, nil

	// Explictly list nodes that do not produce constraints
	case *Program,
		*PackageClause,
		*Extern,
		*ExternBlock,
		*OptionStatement,
		*Identifier,
		*FunctionParameters,
		*ExpressionStatement:
		return nil, nil
	default:
		return nil, fmt.Errorf("unsupported %T", n)
	}
}

// freshType produces a copy of the type with all type variables replaced with fresh ones.
func (v ConstraintGenerator) freshType(typ PolyType) PolyType {
	ftv := typ.freeVars(nil)
	subst := make(Substitution, len(ftv))
	for _, tv := range ftv {
		f := v.cs.f.Fresh()
		for ftv.contains(f) {
			f = v.cs.f.Fresh()
		}
		subst[tv] = f
	}
	t := subst.ApplyType(typ)
	return t
}

func (v ConstraintGenerator) applyKindConstraints(typ PolyType) PolyType {
	// Check if this type knows about its kind constraints
	if kt, ok := typ.(KindConstrainter); ok {
		tv := v.cs.f.Fresh()
		v.cs.AddKindConst(tv, kt.KindConstraint())
		return tv
	}
	return typ
}

func (v ConstraintGenerator) constrainExistingIdent(name string, typ PolyType, loc ast.SourceLocation) {
	existing, ok := v.env.LocalLookup(name)
	if ok {
		v.cs.AddTypeConst(typ, existing.T, loc)
	}
}

// Constraints is a set of constraints.
type Constraints struct {
	f           *fresher
	annotations map[Node]annotation

	typeConst []TypeConstraint
	kindConst map[Tvar][]Kind
}

func (c *Constraints) Copy() *Constraints {
	n := &Constraints{
		f:           new(fresher),
		annotations: make(map[Node]annotation, len(c.annotations)),
		typeConst:   make([]TypeConstraint, len(c.typeConst)),
		kindConst:   make(map[Tvar][]Kind, len(c.kindConst)),
	}
	*n.f = *c.f
	for k, v := range c.annotations {
		n.annotations[k] = v
	}
	copy(n.typeConst, c.typeConst)
	for k, v := range c.kindConst {
		kinds := make([]Kind, len(v))
		copy(kinds, v)
		n.kindConst[k] = kinds
	}
	return n
}

// TypeConstraint states that the left and right types must be equal.
type TypeConstraint struct {
	l, r PolyType
	loc  ast.SourceLocation
}

func (tc TypeConstraint) String() string {
	return fmt.Sprintf("%v = %v @ %v", tc.l, tc.r, tc.loc)
}

func (c *Constraints) AddTypeConst(l, r PolyType, loc ast.SourceLocation) {
	c.typeConst = append(c.typeConst, TypeConstraint{
		l:   l,
		r:   r,
		loc: loc,
	})
}

func (c *Constraints) AddKindConst(tv Tvar, k Kind) {
	c.kindConst[tv] = append(c.kindConst[tv], k)
}

// Instantiate produces a new poly type where the free variables from the scheme have been made fresh.
// This way each new instantiation of a scheme is independent of the other but all have the same constraint structure.
func (c *Constraints) Instantiate(s Scheme, loc ast.SourceLocation) (t PolyType) {
	if len(s.Free) == 0 {
		return s.T
	}
	// Create a substituion for the new type variables
	subst := make(Substitution, len(s.Free))
	for _, tv := range s.Free {
		fresh := c.f.Fresh()
		subst[tv] = fresh
	}

	// Add any new kind constraints
	for _, tv := range s.Free {
		ks, ok := c.kindConst[tv]
		if ok {
			ntv := subst.ApplyTvar(tv)
			for _, k := range ks {
				nk := subst.ApplyKind(k)
				c.AddKindConst(ntv, nk)
			}
		}
	}

	// Add any new type constraints
	for _, tc := range c.typeConst {
		fvs := tc.l.freeVars(c)
		// Only add new constraints that constrain the left hand free vars
		if fvs.hasIntersect(s.Free) {
			l := subst.ApplyType(tc.l)
			r := subst.ApplyType(tc.r)
			c.AddTypeConst(l, r, loc)
		}
	}

	return subst.ApplyType(s.T)
}

func (c *Constraints) String() string {
	var builder strings.Builder
	builder.WriteString("{\nannotations:\n")
	for n, ann := range c.annotations {
		fmt.Fprintf(&builder, "%T@%v = %v,\n", n, n.Location(), ann.Var)
	}
	builder.WriteString("types:\n")
	for _, tc := range c.typeConst {
		fmt.Fprintf(&builder, "%v,\n", tc)
	}
	builder.WriteString("kinds:\n")
	for tv, ks := range c.kindConst {
		fmt.Fprintf(&builder, "%v = %v,\n", tv, ks)
	}
	builder.WriteString("}")
	return builder.String()
}
