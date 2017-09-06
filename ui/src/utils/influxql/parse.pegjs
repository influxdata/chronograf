{
  var Moment = require('moment');
  var _ = require('lodash');
}

SelectStmt
  = "SELECT"i _ fields:Fields _ from:FromClause _ clause:WhereClause? _ groupBy:GroupByClause? {
    return {
      "fields": fields,
      "from": from,
      "groupBy": groupBy,
      "clause": clause,
    }
}

//////////////
// Group By //
//////////////

GroupByClause
  = "GROUP BY"i _ dimensions:Dimensions _ fill:Fill? {
  var tags = []
  var times = []
  dimensions.forEach(function(dimension) {
    if (dimension.type === 'GroupByTag') {
      tags.push(dimension.value)
    } else if (dimension.type === 'TimeFunc') {
      times.push(dimension.value)
    }
  })
  if (times.length > 1) {
    error('`time()` can only appear once in a GROUP BY')
  }
  return {
    tags: tags.length ? tags : null,
    time: times.length ? times[0] : null,
    fill: fill ? fill : null,
  }
}

Dimensions
  = head:TagOrTime tail:( "," _ TagOrTime)* {
  return tail.reduce(function(dimensions, dimension) {
    return dimensions.concat(dimension[2])
  }, [head])
}

TagOrTime
  = TimeFunc / GroupByTag

GroupByTag = tag:QuotedIdentifier {
  return {
    value: tag,
    type: 'GroupByTag',
  }
}

TimeFunc
  = "time(" _ dur:DurLit _ ")" {
    return {
      value: dur,
      type: 'TimeFunc',
    }
  }

Fill
  = "FILL"i "(" _ fill:("null" / "none" / FloatLit / "linear" / "previous") _ ")" {
    return fill
  }

////////////
// Fields //
////////////

Fields
  = head:FieldExpr tail:( "," _ FieldExpr)* {
  return tail.reduce(function(fields, field) {
    return fields.concat(field[2])
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
        return [{
          "op": term[1],
          "lhs": terms[terms.length - 1],
          "rhs": term[3]
        }]
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
        return [{
          "op": term[1],
          "lhs": terms[terms.length - 1],
          "rhs": term[3]
        }]
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
  if (type === "") {
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
  = "FROM"i _ from:DBRPOrSubquery {
    return from
}

DBRPOrSubquery = DBRP / Subquery

Subquery
  = "(" _ subquery:SelectStmt _ ")" {
  return subquery
}

//////////////////
// Measurements //
//////////////////

DBRP
  = QualifiedMeasurement / Measurement

QualifiedMeasurement
  = FQMeasurement / RPMeasurement

RPMeasurement
  = rp:QuotedIdentifier "." measurement:Measurement {
  return {
    db: null,
    rp: rp,
    measurement: measurement,
  }
}

FQMeasurement
  = db:QuotedIdentifier "." rp:QuotedIdentifier? "." measurement:Measurement {
  return {
    db: db,
    rp: rp,
    measurement: measurement,
  }
}

Measurement = QuotedIdentifier

QuotedIdentifier = chars:( DoubleQuotedName / Chars+) {
  return chars.join("");
}

///////////////////
// Where clauses //
///////////////////


WhereClause = "WHERE"i _ clauses:Expr {
  return clauses
}

Expr = Disjunction

Disjunction = head:Conjunction tail:( _ "OR"i _ rhs:Conjunction)* {
  return {
    "type": "BinaryExpr",
    "operator": "OR",
    "operands": tail.reduce(function(terms, term) {
      return terms.concat(term)
    }, [head])
  }
}

Conjunction = head:Comparator tail:( _ "AND"i _ Comparator)* {
  return {
    "type": "BinaryExpr",
    "operator": "AND",
    "operands": tail.reduce(function(terms, term) {
      return terms.concat(term)
    }, [head])
  }
}

Comparator = lhs:Value rhs:( _ Operator _ Value)* {
  if (rhs.length !== 0) {
    return {
      "type": "BinaryExpr",
      "operator": rhs[1],
      "operands": [lhs, rhs[3]]
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

DurLit = ordinal:Digit+ unit:("s" / "m" / "h" / "d" / "w" / "ns" / "u" / "µ" / "ms") {
  return ordinal.join('') + unit
}

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
  return +numeral.join('')
}

FloatLit = numeral:Digit+ fraction:("." Digit+)? {
  return Number(+numeral.join('') + _.flatten(fraction).join(''))
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
