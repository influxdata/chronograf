{
  var Moment = require('moment');
  var _ = require('lodash');
}

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

Unary = "now()" / VarRef / DurLit / DateStr

Operator = "=" / ">" / "<" / "-"

DurLit = Digit+ ("m" / "y")

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
