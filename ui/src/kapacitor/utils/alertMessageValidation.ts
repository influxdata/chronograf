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

export const mismatchedBrackets = (str: string): boolean => {
  const arr = str.split('')
  const accumulator: string[] = []
  let isMismatched = false
  arr.forEach(cur => {
    if (cur === '{') {
      accumulator.push('{')
    }
    if (cur === '}') {
      const lastElt = accumulator.pop()
      if (lastElt !== '{') {
        isMismatched = true
      }
    }
  })

  if (accumulator.length !== 0) {
    isMismatched = true
  }
  return isMismatched
}

export const isValidMessage = (message: string): boolean => {
  if (message[message.length] === '}') {
    message = message + ' '
  }

  const malformedTemplateRegexp1 = RegExp('(({{)([^{}]*)(})([^}]+))') // matches {{*} where star does not contain '{' or '}'

  if (malformedTemplateRegexp1.test(message)) {
    return false
  }

  if (mismatchedBrackets(message)) {
    return false
  }

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
