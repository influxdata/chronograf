import uuid from 'uuid'
import _ from 'lodash'

import {Filter} from 'src/types/logs'
import {
  Term,
  TermPart,
  TermRule,
  TermType,
  Operator,
  TokenLiteralMatch,
} from 'src/types/logs'

const MESSAGE_KEY = 'message'

export const createRule = (
  part: TermPart,
  type: TermType = TermType.INCLUDE
): TermRule => ({
  type,
  pattern: getPattern(type, part),
})

const getPattern = (type: TermType, phrase: TermPart): RegExp => {
  switch (type) {
    case TermType.EXCLUDE:
      return new RegExp(`^${TermPart.EXCLUSION}${phrase}`)
    default:
      return new RegExp(`^${phrase}`)
  }
}

export const LOG_SEARCH_TERMS: TermRule[] = [
  createRule(TermPart.SINGLE_QUOTED, TermType.EXCLUDE),
  createRule(TermPart.DOUBLE_QUOTED, TermType.EXCLUDE),
  createRule(TermPart.SINGLE_QUOTED),
  createRule(TermPart.DOUBLE_QUOTED),
  createRule(TermPart.UNQUOTED_WORD, TermType.EXCLUDE),
  createRule(TermPart.UNQUOTED_WORD),
]

export const searchToFilters = (searchTerm: string): Filter[] => {
  const allTerms = extractTerms(searchTerm, LOG_SEARCH_TERMS)

  return termsToFilters(allTerms)
}

const termsToFilters = (terms: Term[]): Filter[] => {
  return terms.map(t => createMessageFilter(t.term, termToOp(t)))
}

const extractTerms = (searchTerms: string, rules: TermRule[]): Term[] => {
  let tokens = []
  let text = searchTerms.trim()

  while (!_.isEmpty(text)) {
    const {nextTerm, nextText} = extractNextTerm(text, rules)
    tokens = [...tokens, nextTerm]
    text = nextText
  }

  return tokens
}

const extractNextTerm = (text, rules: TermRule[]) => {
  const {literal, rule, nextText} = readToken(eatSpaces(text), rules)

  const nextTerm = createTerm(rule.type, literal)

  return {nextText, nextTerm}
}

const eatSpaces = (text: string): string => {
  return text.trim()
}

const readToken = (text: string, rules: TermRule[]): TokenLiteralMatch => {
  const rule = rules.find(r => text.match(new RegExp(r.pattern)) !== null)

  const term = new RegExp(rule.pattern).exec(text)
  const literal = term[1]
  // differs from literal length because of quote and exclusion removal
  const termLength = term[0].length
  const nextText = text.slice(termLength)

  return {literal, nextText, rule}
}

const createTerm = (type: TermType, term: string): Term => ({
  type,
  term,
})

const createMessageFilter = (value: string, operator: Operator): Filter => ({
  id: uuid.v4(),
  key: MESSAGE_KEY,
  value,
  operator,
})

const termToOp = (term: Term): Operator => {
  switch (term.type) {
    case TermType.EXCLUDE:
      return Operator.NOT_LIKE
    case TermType.INCLUDE:
      return Operator.LIKE
  }
}
