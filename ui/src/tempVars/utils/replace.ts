import {topologicalSort, graphFromTemplates} from 'src/tempVars/utils/graph'

import {
  Template,
  TemplateType,
  TemplateValueType,
  TemplateValue,
} from 'src/types/tempVars'
import {TEMP_VAR_INTERVAL} from 'src/shared/constants'
const DESIRED_POINTS_PER_GRAPH = 360

export const computeInterval = (durationMs: number): number => {
  return Math.round(durationMs / DESIRED_POINTS_PER_GRAPH)
}

export const replaceInterval = (query: string, durationMs: number) => {
  if (!query.includes(TEMP_VAR_INTERVAL)) {
    return query
  }

  const interval = computeInterval(durationMs)
  const renderedQuery = replaceAll(query, TEMP_VAR_INTERVAL, `${interval}ms`)

  return renderedQuery
}

const sortTemplates = (templates: Template[]): Template[] => {
  const graph = graphFromTemplates(templates)

  return topologicalSort(graph).map((t) => t.initialTemplate)
}

const templateReplace = (query: string, templates: Template[]) => {
  const sortedTemplates = sortTemplates(templates)

  return sortedTemplates.reduce(
    (acc, template) => renderTemplate(acc, template),
    query
  )
}

const renderTemplate = (query: string, template: Template): string => {
  if (!template.values.length) {
    return query
  }

  if (query && !query.includes(template.tempVar)) {
    return query
  }

  const localSelectedTemplateValue: TemplateValue = template.values.find(
    (v) => v.localSelected
  )
  const selectedTemplateValue: TemplateValue = template.values.find(
    (v) => v.selected
  )

  const templateValue = localSelectedTemplateValue || selectedTemplateValue
  if (!templateValue) {
    return query
  }

  const {tempVar} = template
  const {value, type} = templateValue

  let q = ''

  // First replace all template variable types in regular expressions.  Values should appear unquoted.
  switch (type) {
    case TemplateValueType.TagKey:
    case TemplateValueType.FieldKey:
    case TemplateValueType.Measurement:
    case TemplateValueType.Database:
    case TemplateValueType.TagValue:
    case TemplateValueType.TimeStamp:
      q = replaceAllRegex(query, tempVar, value)
      break
    default:
      q = query
  }

  // Then render template variables not in regular expressions

  switch (type) {
    case TemplateValueType.TagKey:
    case TemplateValueType.FieldKey:
    case TemplateValueType.Measurement:
    case TemplateValueType.Database:
      return replaceAll(q, tempVar, `"${value}"`)
    case TemplateValueType.TagValue:
    case TemplateValueType.TimeStamp:
      return replaceAll(q, tempVar, `'${value}'`)
    case TemplateValueType.CSV:
    case TemplateValueType.Constant:
    case TemplateValueType.MetaQuery:
    case TemplateValueType.Map:
      return replaceAll(q, tempVar, value)
    default:
      return query
  }
}

const REGEX_COMPARATORS = ['=~', '!~']
const REGEX_DELIMITER = '/'

const replaceAllRegex = (
  query: string,
  search: string,
  replacement: string
) => {
  let result = query
  let i = 0

  while (i < result.length - 1) {
    const chars = result[i] + result[i + 1]
    const isStartOfRegex = REGEX_COMPARATORS.includes(chars)

    if (!isStartOfRegex) {
      i += 1
      continue
    }

    const regexStart = findNext(result, REGEX_DELIMITER, i)
    const regexEnd = findNext(result, REGEX_DELIMITER, regexStart + 1)
    const regexContent = result.slice(regexStart + 1, regexEnd)
    const replacedRegexContent = regexContent.replace(search, replacement)

    result =
      result.slice(0, regexStart + 1) +
      replacedRegexContent +
      result.slice(regexEnd)

    i = findNext(result, REGEX_DELIMITER, regexStart + 1)
  }

  return result
}

const findNext = (s: string, t: string, startIndex: number) => {
  const tail = s.slice(startIndex)
  const i = tail.indexOf(t)

  if (i === -1) {
    throw new Error(`Expected token '${t}' in '${tail}'`)
  }

  return startIndex + i
}

const replaceAll = (query: string, search: string, replacement: string) => {
  return (query || '').split(search).join(replacement)
}

export const templateInternalReplace = (template: Template): string => {
  const {influxql, db, measurement, tagKey} = template.query

  if (template.type === TemplateType.MetaQuery) {
    // A custom meta query template may reference other templates whose names
    // conflict with the `database`, `measurement` and `tagKey` fields stored
    // within a template's `query` object. Since these fields are always empty
    // for a custom meta query template, we do not attempt to replace them
    return influxql
  }

  return influxql
    .replace(':database:', `"${db}"`)
    .replace(':measurement:', `"${measurement}"`)
    .replace(':tagKey:', `"${tagKey}"`)
}

export default templateReplace
