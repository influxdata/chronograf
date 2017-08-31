SelectStmt
  = "SELECT" _ fields:Fields _ from:FromClause _ clause:WhereClause? {
    return {
      "fields": fields.map(function(field) {
         return {
            "name": field,
            "location": location(),
         }
      }),
      "measurement": from.measurement,
      "clause": clause,
    }
}
    
Fields
  = Field ( "," _ Field)*
    
Field = chars:Chars+ {
  return chars.join("");
}

FromClause
  = "FROM" _ measurement:Measurement {
    return {
      "measurement": measurement,
    }
}
    
Measurement = chars:( DoubleQuotedName / Chars+) {
  return chars.join("");
}

///////////////////
// Where clauses //
///////////////////


WhereClause = "WHERE" _ clauses:Expr {
  return clauses
}

Expr = Disjunction

Disjunction = lhs:Conjunction rhs:( _ "OR"i _ rhs:Conjunction)* {
  return {
    "type": "BinaryExpr",
    "operator": "OR",
    "operands": rhs ? [lhs, rhs] : [lhs]
  }
}

Conjunction = lhs:Comparator rhs:( _ "AND"i _ Comparator)* {
  return {
    "type": "BinaryExpr",
    "operator": "AND",
    "operands": rhs ? [lhs, rhs] : [lhs]
  }
}

Comparator = lhs:Value rhs:( _ Operator _ Value)* {
  if (rhs) {
    return {
      "type": "BinaryExpr",
      "operator": rhs[0][1],
      "operands": [lhs, rhs[1]]
    }
  } else {
    return {
      "type": "UnaryExpr",
      "operands": [lhs]
    }
  }
}

Value = Unary / SubExpr

SubExpr = '(' expr:Expr ')' {
  return expr
}

Unary = VarRef

Operator = "="

VarRef = ref:DoubleQuotedName {
  return {
    type: "primitive",
    primitiveType: "varRef",
    value: ref.join("")
  }
}

////////////////
// Primitives //
////////////////

Chars = [A-Za-z_]
CharSpace = [A-Za-z ]

DoubleQuotedName = "\"" chars:( CharSpace+ ) "\"" {
  return chars;
}

_ "whitespace"
  = [ \t\n\r]*
