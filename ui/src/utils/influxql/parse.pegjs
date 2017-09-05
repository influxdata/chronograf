{
  var Moment = require('moment');
  var _ = require('lodash');
}

SelectStmt
  = "SELECT"i _ fields:Fields _ from:FromClause _ clause:WhereClause? {
    return {
      "fields": fields,
      "measurement": from.measurement,
      "clause": clause,
    }
}
    
////////////
// Fields //
////////////

Fields
  = head:FieldExpr tail:( "," _ FieldExpr)* {
  return tail.reduce(function(fields, field) {
    return fields.push(field)
  }, [head])
}
    
FieldExpr
  = field:AdditiveField _ alias:Alias? {
  return {
    "field": field,
    "alias": alias
  }
}

Alias
  = "as"i _ alias:Identifier {
  return alias
}

AdditiveField
  = head:MultiplicativeField tail:(_ ("+" / "-") _ MultiplicativeField)* {
  if (tail.length === 0) {
    return head
  } else {
    return {
      "type": "BinaryExpr",
      "values": tail.reduce(function(terms, term) {
        return terms.concat({
          "op": term[1],
          "term": term[3]
        })
      }, [head])
    }
  }
}

MultiplicativeField
  = head:FunctionOrValue tail:(_ ("*" / "/") _ FunctionOrValue)* {
  if (tail.length === 0) {
    return head
  } else {
    return {
      "type": "BinaryExpr",
      "values": tail.reduce(function(terms, term) {
        return terms.concat({
          "op": term[1],
          "term": term[3]
        })
      }, [head])
    }
  }
}

FunctionOrValue
  = Function / FieldValue

Function
  = funcName:(Aggregate / Selector) "(" operand:FieldOrTag ")" {
  return {
    "type": "Function",
    "function": funcName,
    "operand": operand
  }
}

Aggregate
  = ("count" / "distinct" / "integral" / "mean" / "median" / "mode" / "spread" / "stddev" / "sum")

Selector
  = ("bottom" / "first") 

FieldValue
  = FieldOrTag / NumLit / "(" FieldExpr ")"

FieldOrTag
  = ident:Identifier type:TypeCast? {
  if (type !== "") {
    return {
      "type": "Identifier",
      "identType": "field",
      "identifier": ident
    }
  } else {
    return {
      "type": "Identifier",
      "identType": type,
      "identifier": ident
    }
  }
}

TypeCast
  = "::" type:("field" / "tag") {
  return type
}

Identifier = chars:Chars+ {
  return chars.join("");
}

FromClause
  = "FROM"i _ measurement:Measurement {
    return {
      "measurement": measurement,
    }
}
    
//////////////////
// Measurements //
//////////////////

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

Unary = NowFunc / VarRef / DurLit / DateStr

Operator = "=" / ">" / "<" / "-"

DurLit = Digit+ ("m" / "y")

NowFunc = "now()"

VarRef = ref:( DoubleQuotedName / Chars+ ) {
  return {
    type: "primitive",
    primitiveType: "varRef",
    value: ref.join("")
  }
}

////////////////
// Primitives //
////////////////

// Character Sets

Chars = [A-Za-z_]
CharSpace = [A-Za-z ]
Digit = [0-9]

// Number Literals

NumLit = numeral:Digit+ ("." Digit+)? {
  return +numeral.join("")
}

// Date Literals

DateStr = "'" date:DateTime "'" {
  var dateStr = _.flatten(date).join("")
  return Moment(dateStr, 'YYYY-MM-DD HH:mm:ss.SSSSSSSSS');
}

DateTime = FullDate "T" FullTime
FullDate = DateFullYear "-" DateMonth "-" DateMDay
FullTime = PartialTime TimeOffset

TimeOffset = ("Z" / TimeNumOffset)
TimeNumOffset = ("+" / "-") TimeHour ":" TimeMinute

PartialTime = TimeHour ":" TimeMinute ":" TimeSecond TimeSecFrac?

DateFullYear = Digit Digit Digit Digit
DateMonth = Digit Digit
DateMDay = Digit Digit

TimeHour = Digit Digit
TimeMinute = Digit Digit
TimeSecond = Digit Digit
TimeSecFrac = "." Digit+

DoubleQuotedName = "\"" chars:( CharSpace+ ) "\"" {
  return chars;
}

_ "whitespace"
  = [ \t\n\r]*
