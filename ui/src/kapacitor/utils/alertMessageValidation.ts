import _ from 'lodash'
import {RULE_MESSAGE_TEMPLATE_TEXTS} from 'src/kapacitor/constants'

// the following template variables must also pass validation, see #5492
// they are not that much common to be part of RULE_MESSAGE_TEMPLATE_TEXTS
const EXTRA_MESSAGE_VARIABLES = ['.Time.Unix', '.Time.UnixNano']

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

  return (
    fieldsRegex.test(template) ||
    tagsRegex.test(template) ||
    ifRegex.test(template) ||
    rangeRegex.test(template) ||
    blockRegex.test(template) ||
    withRegex.test(template)
  )
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
