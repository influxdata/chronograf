import {MatchType, Filter, MatchSection} from 'src/types/logs'
import uuid from 'uuid'

export const getMatchSections = (
  filters: Filter[],
  text: string
): MatchSection[] => {
  if (filters.length === 0) {
    return [createSection(MatchType.NONE, text)]
  }

  try {
    const pattern = filtersToPattern(filters)
    return sectionOnPattern(pattern, text)
  } catch (e) {
    console.error('Syntax Error: bad search filter expression')

    return [createSection(MatchType.NONE, text)]
  }
}

const sectionOnPattern = (pattern: RegExp, text) => {
  let sections = []
  let remaining = text

  for (
    let match = remaining.match(pattern);
    match !== null;
    match = remaining.match(pattern)
  ) {
    remaining = match[match.length - 1]
    sections = [
      ...sections,
      createSection(MatchType.NONE, match[1]),
      createSection(MatchType.MATCH, match[2]),
    ]
  }

  return [...sections, createSection(MatchType.NONE, remaining)]
}

const createSection = (type: MatchType, text: string): MatchSection => ({
  id: uuid.v4(),
  type,
  text,
})

const filtersToPattern = (filters: Filter[]): RegExp => {
  const values = filters.map(f => f.value).join('|')

  return new RegExp(`^(.*?)(${values})(.*)`)
}
