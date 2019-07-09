import _ from 'lodash'
import {RULE_MESSAGE_TEMPLATE_TEXTS} from 'src/kapacitor/constants'

export const isValidTemplate = (template: string): boolean => {
  const exactMatch = !!_.find(RULE_MESSAGE_TEMPLATE_TEXTS, t => t === template)
  const fieldsRegex = /(index .Fields ".+")/
  const tagsRegex = /(index .Tags ".+")/
  const ifRegex = /(if .+)/
  const rangeRegex = /(range .+)/
  const blockRegex = /(block .+)/
  const withRegex = /(with .+)/

  const fuzzyMatch =
    fieldsRegex.test(template) ||
    tagsRegex.test(template) ||
    ifRegex.test(template) ||
    rangeRegex.test(template) ||
    blockRegex.test(template) ||
    withRegex.test(template)

  return exactMatch || fuzzyMatch
}

export const isValidMessage = (message: string): boolean => {
  const templateRegexp = /((?:{{)([^{}]*)(?:}}))/g // matches {{*}} where star does not contain '{' or '}'
  const matches = []
  let match = templateRegexp.exec(message)
  while (match) {
    matches[matches.length] = match[2].trim()
    match = templateRegexp.exec(message)
  }

  const isValid = _.every(matches, m => isValidTemplate(m))

  return isValid
}

export default isValidMessage
