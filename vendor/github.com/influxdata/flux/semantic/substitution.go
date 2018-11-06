package semantic

import (
	"fmt"
	"sort"
	"strings"
)

// Substitution is a maping of type variables to a poly type.
type Substitution map[Tvar]PolyType

func (s Substitution) ApplyType(t PolyType) PolyType {
	for tv, typ := range s {
		t = t.substituteType(tv, typ)
	}
	return t
}
func (s Substitution) ApplyScheme(ts Scheme) Scheme {
	for tv, typ := range s {
		ts.T = ts.T.substituteType(tv, typ)
	}
	return ts
}

func (s Substitution) ApplyKind(k Kind) Kind {
	for tv, typ := range s {
		k = k.substituteKind(tv, typ)
	}
	return k
}

func (s Substitution) ApplyEnv(env *Env) *Env {
	for tv, typ := range s {
		env.RangeSet(func(n string, scheme Scheme) Scheme {
			return scheme.Substitute(tv, typ)
		})
	}
	return env
}

func (s Substitution) ApplyTvar(tv Tvar) Tvar {
	switch t := s[tv].(type) {
	case Tvar:
		return t
	default:
		return tv
	}
}

// Merge r into l.
func (l Substitution) Merge(r Substitution) {
	// Apply right to all of l
	for tvL, tL := range l {
		l[r.ApplyTvar(tvL)] = r.ApplyType(tL)
	}
	// Add missing keys from r to l
	for tvR, tR := range r {
		if _, ok := l[tvR]; !ok {
			l[tvR] = tR
		}
	}
}

func (s Substitution) String() string {
	var builder strings.Builder
	vars := make([]int, 0, len(s))
	for tv := range s {
		vars = append(vars, int(tv))
	}
	sort.Ints(vars)
	builder.WriteString("{")
	if len(s) > 1 {
		builder.WriteString("\n")
	}
	for i, tvi := range vars {
		tv := Tvar(tvi)
		if i != 0 {
			builder.WriteString(",\n")
		}
		fmt.Fprintf(&builder, "%v = %v", tv, s[tv])
	}
	builder.WriteString("}")
	return builder.String()
}
