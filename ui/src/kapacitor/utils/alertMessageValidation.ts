import _ from 'lodash'
import {RULE_MESSAGE_TEMPLATE_TEXTS} from 'src/kapacitor/constants'

// the following template variables must also pass validation
// they are not that much common to be part of RULE_MESSAGE_TEMPLATE_TEXTS
const EXTRA_MESSAGE_VARIABLES = ['.Time.Unix', '.Time.UnixNano', '.']
// templates with global functions are valid as well - https://golang.org/pkg/text/template/#hdr-Functions
const GLOBAL_FUNCTIONS = [
  'and',
  'call',
  'html',
  'index',
  'slice',
  'js',
  'len',
  'not',
  'print',
  'printf',
  'println',
  'urlquery',
]

export const isValidTemplate = (template: string): boolean => {
  if (
    !!_.find(RULE_MESSAGE_TEMPLATE_TEXTS, t => t === template) ||
    !!_.find(EXTRA_MESSAGE_VARIABLES, t => t === template)
  ) {
    return true
  }

  const fieldsRegex = /(index .Fields ".+")/
  const tagsRegex = /(index .Tags ".+")/
  const ifRegex = /(if .+)/
  const rangeRegex = /(range .+)/
  const blockRegex = /(block .+)/
  const withRegex = /(with .+)/

  const regexpTests =
    fieldsRegex.test(template) ||
    tagsRegex.test(template) ||
    ifRegex.test(template) ||
    rangeRegex.test(template) ||
    blockRegex.test(template) ||
    withRegex.test(template)
  if (regexpTests) {
    return true
  }

  // check if we have a prefix that we can remove
  const validPrefix = _.find(
    GLOBAL_FUNCTIONS,
    t =>
      template.startsWith(t) &&
      template.length > t.length &&
      /\s/.test(template[t.length])
  )
  if (!!validPrefix) {
    return isValidTemplate(template.substring(validPrefix.length + 1).trim())
  }
  return false
}

export const isValidMessage = (message: string): boolean => {
  const templateRegexp = /((?:{{)([^{}]*)(?:}}))/g // matches {{*}} where star does not contain '{' or '}'
  const matches = []
  let match = templateRegexp.exec(message)
  while (match) {
    let insideBraces = match[2]
    // ignore template's text trimming when '{{- ' prefix or ' -}}' suffix
    if (insideBraces.startsWith('- ')) {
      insideBraces = insideBraces.substring(2)
    }
    if (insideBraces.endsWith(' -')) {
      insideBraces = insideBraces.substring(0, insideBraces.length - 2)
    }
    matches[matches.length] = insideBraces.trim()
    match = templateRegexp.exec(message)
  }

  const isValid = _.every(matches, m => isValidTemplate(m))

  return isValid
}

export default isValidMessage
