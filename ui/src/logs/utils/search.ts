import uuid from 'uuid'
import _ from 'lodash'

import {Filter} from 'src/types/logs'
import {Term, TermPart, TermRule, TermType, Operator} from 'src/types/logs'

const MESSAGE_KEY = 'message'

type Extraction = [Term[], string]

export const createRule = (
  part: TermPart,
  type: TermType = TermType.INCLUDE
): TermRule => ({
  type,
  pattern: getPattern(type, part),
})

const getPattern = (type: TermType, phrase: TermPart) => {
  switch (type) {
    case TermType.EXCLUDE:
      return `${TermPart.START_EXCLUSION}${phrase}`
    default:
      return `${TermPart.START}${phrase}`
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
  const allTerms = extractTermRules(searchTerm, LOG_SEARCH_TERMS)

  return termsToFilters(allTerms)
}

const termsToFilters = (terms: Term[]): Filter[] => {
  return terms.map(t => createMessageFilter(t.term, termToOp(t)))
}

const extractTermRules = (searchTerms: string, rules: TermRule[]): Term[] => {
  const result: Extraction = [[], searchTerms]
  return _.reduce<TermRule[], Extraction>(rules, extractTermRule, result)[0]
}

const extractTermRule = (
  [prevPhrases, prevText]: Extraction,
  rule: TermRule
): Extraction => {
  const phrases: Term[] = getPhraseMatches(rule, prevText)
  const text: string = prevText.replace(new RegExp(rule.pattern, 'g'), '')

  return [[...prevPhrases, ...phrases], text]
}

const getPhraseMatches = (rule: TermRule, text: string): Term[] => {
  const pattern = new RegExp(rule.pattern, 'g')
  let matches: Term[] = []
  let match = pattern.exec(text)

  while (match) {
    matches = [...matches, createTerm(rule.type, match[2])]

    match = pattern.exec(text)
  }

  return matches
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
