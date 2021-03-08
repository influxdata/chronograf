import {MatchType, Filter, MatchSection, Operator} from 'src/types/logs'
import uuid from 'uuid'

export const getMatchSections = (
  pattern: string,
  text: string
): MatchSection[] => {
  if (!pattern) {
    return [createSection(MatchType.NONE, text)]
  }

  const regexp = new RegExp(pattern)
  return matchSections(regexp, text)
}

const matchSections = (re: RegExp, text) => {
  const sections = []
  let remaining = text

  for (
    let match = remaining.match(re);
    match !== null;
    match = remaining.match(re)
  ) {
    remaining = match[match.length - 1]
    sections.push(
      createSection(MatchType.NONE, match[1]),
      createSection(MatchType.MATCH, match[2])
    )
  }

  sections.push(createSection(MatchType.NONE, remaining))

  return sections
}

const createSection = (type: MatchType, text: string): MatchSection => ({
  id: uuid.v4(),
  type,
  text,
})

export const filtersToPattern = (filters: Filter[]): string => {
  if (filters.length === 0) {
    return null
  }

  const values = filters.map((f) => f.value).join('|')

  return `^(.*?)(${values})(.*)`
}

export const getValidMessageFilters = (filters: Filter[]): Filter[] =>
  filters.filter(isValidMessageFilter)

const isValidMessageFilter = (f: Filter): boolean =>
  isMessage(f.key) && isLikeOp(f.operator) && isValidRegExp(f.value)

const isMessage = (key: string): boolean => key === 'message'
const isLikeOp = (op: string): boolean => op === Operator.LIKE

const isValidRegExp = (value: string): boolean => {
  try {
    RegExp(value)
    return true
  } catch (error) {
    return false
  }
}
