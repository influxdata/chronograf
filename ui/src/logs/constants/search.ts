import {createRule} from 'src/logs/utils/search'

import {TermPart, TermType, TermRule} from 'src/types/logs'

export const LOG_SEARCH_TERMS: TermRule[] = [
  createRule(TermPart.SINGLE_QUOTED, TermType.EXCLUDE),
  createRule(TermPart.DOUBLE_QUOTED, TermType.EXCLUDE),
  createRule(TermPart.SINGLE_QUOTED),
  createRule(TermPart.DOUBLE_QUOTED),
  createRule(TermPart.UNQUOTED_WORD, TermType.EXCLUDE),
  createRule(TermPart.UNQUOTED_WORD),
]
