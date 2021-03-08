import {IInstance} from 'react-codemirror2'

import {Suggestion} from 'src/types/flux'
import {Hints} from 'src/types/codemirror'

export const EXCLUDED_KEYS = new Set([
  'ArrowRight',
  'ArrowLeft',
  'ArrowDown',
  'ArrowUp',
  'Backspace',
  'Tab',
  'Enter',
  'Shift',
  'Ctrl',
  'Control',
  'Alt',
  'Pause',
  'Capslock',
  'Escape',
  'Pageup',
  'Pagedown',
  'End',
  'Home',
  'Left',
  'Up',
  'Right',
  'Down',
  'Insert',
  'Delete',
  'Left window key',
  'Right window key',
  'Select',
  'Add',
  'Subtract',
  'Decimal point',
  'Divide',
  '>',
  '|',
  ')',
  'F1',
  'F2',
  'F3',
  'F4',
  'F5',
  'F6',
  'F7',
  'F8',
  'F9',
  'F10',
  'F11',
  'F12',
  'Numlock',
  'Scrolllock',
  'Semicolon',
  'Equalsign',
  'Comma',
  'Dash',
  'Slash',
  'Graveaccent',
  'Backslash',
  'Quote',
  'Meta',
  ' ',
])

export const getSuggestions = (
  editor: IInstance,
  allSuggestions: Suggestion[]
): Hints => {
  const cursor = editor.getCursor()
  const currentLineNumber = cursor.line
  const currentLineText = editor.getLine(cursor.line)
  const cursorPosition = cursor.ch

  const {start, end, suggestions} = getSuggestionsHelper(
    currentLineText,
    cursorPosition,
    allSuggestions
  )

  return {
    from: {line: currentLineNumber, ch: start},
    to: {line: currentLineNumber, ch: end},
    list: suggestions,
  }
}

export const getSuggestionsHelper = (
  currentLineText: string,
  cursorPosition: number,
  allSuggestions: Suggestion[]
) => {
  if (shouldCompleteParam(currentLineText, cursorPosition)) {
    return getParamSuggestions(currentLineText, cursorPosition, allSuggestions)
  }

  if (shouldCompleteFunction(currentLineText, cursorPosition)) {
    return getFunctionSuggestions(
      currentLineText,
      cursorPosition,
      allSuggestions
    )
  }

  return {
    start: -1,
    end: -1,
    suggestions: [],
  }
}

const shouldCompleteFunction = (currentLineText, cursorPosition) => {
  const startOfFunc = '('
  const endOfFunc = ')'
  const endOfParamKey = ':'
  const endOfParam = ','
  const pipe = '|>'

  let i = cursorPosition

  // First travel left; the first special characters we should see are from a pipe
  while (i) {
    const char = currentLineText[i]
    const charBefore = currentLineText[i - 1]

    if (charBefore + char === pipe || charBefore + char === endOfFunc + ' ') {
      break
    } else if (char === startOfFunc || char === endOfParamKey) {
      return false
    }
    i -= 1
  }

  i = cursorPosition

  // Then travel right; the first special character we should see is an opening paren '('
  while (i < currentLineText.length) {
    const char = currentLineText[i]

    if (char === endOfParamKey || char === endOfFunc || char === endOfParam) {
      return false
    }

    i += 1
  }

  return true
}

const shouldCompleteParam = (currentLineText, cursorPosition) => {
  let i = cursorPosition

  while (i) {
    const char = currentLineText[i - 1]
    const charBefore = currentLineText[i - 2]

    if (char === ':' || char === '>' || char === ')') {
      return false
    }

    if (char === '(' || charBefore + char === ', ') {
      return true
    }

    i -= 1
  }

  return false
}

export const getParamSuggestions = (
  currentLineText: string,
  cursorPosition: number,
  allSuggestions: Suggestion[]
) => {
  let end = cursorPosition

  while (end && currentLineText[end] !== '(') {
    end -= 1
  }

  let start = end

  while (start && /[\w\(]/.test(currentLineText[start])) {
    start -= 1
  }

  const functionName = currentLineText.slice(start, end).trim()
  const func = allSuggestions.find(({name}) => name === functionName)

  if (!func) {
    return {start, end, suggestions: []}
  }

  let startOfParamKey = cursorPosition

  while (!['(', ' '].includes(currentLineText[startOfParamKey - 1])) {
    startOfParamKey -= 1
  }

  return {
    start: startOfParamKey,
    end: cursorPosition,
    suggestions: Object.entries(func.params).map(([paramName, paramType]) => {
      let displayText = paramName

      // Work around a bug in Flux where types are sometimes returned as "invalid"
      if (paramType !== 'invalid') {
        displayText = `${paramName} <${paramType}>`
      }

      return {
        text: `${paramName}: `,
        displayText,
      }
    }),
  }
}

export const getFunctionSuggestions = (
  currentLineText: string,
  cursorPosition: number,
  allSuggestions: Suggestion[]
) => {
  const formatter = getSuggestionFormatter(currentLineText, cursorPosition)
  const trailingWhitespace = /[\w]+/

  let start = cursorPosition
  let end = start

  // Move end marker until a space or end of line is reached
  while (
    end < currentLineText.length &&
    trailingWhitespace.test(currentLineText.charAt(end))
  ) {
    end += 1
  }

  // Move start marker until a space or the beginning of line is reached
  while (start && trailingWhitespace.test(currentLineText.charAt(start - 1))) {
    start -= 1
  }

  // If not completing inside a current word, return list of all possible suggestions
  if (start === end) {
    return {
      start,
      end,
      suggestions: allSuggestions.map(({name}) => ({
        text: formatter(name),
        displayText: name,
      })),
    }
  }

  // Otherwise return suggestions that contain the current word as a substring
  const currentWord = currentLineText.slice(start, end)
  const listFilter = new RegExp(`^${currentWord}`, 'i')
  const suggestions = allSuggestions
    .map((s) => s.name)
    .filter((name) => name.match(listFilter))
    .map((displayText) => ({text: formatter(displayText), displayText}))

  return {start, end, suggestions}
}

export const getSuggestionFormatter = (
  currentLineText: string,
  cursorPosition: number
) => {
  // Get the last two characters before the cursor that are neither whitespace nor alphanumeric
  const untilCursor = currentLineText
    .slice(0, cursorPosition)
    .replace(/[a-z0-0]*/gi, '')
    .replace(/\s/g, '')

  const n = untilCursor.length
  const prevTwoChars = (untilCursor[n - 2] || '') + (untilCursor[n - 1] || '')

  const formatter = (name: string) => {
    if (prevTwoChars === '|>' || name.startsWith('from')) {
      return name
    }

    return `|> ${name}`
  }

  return formatter
}
