import {Position} from 'codemirror'

// Constants
import {FROM, UNION} from 'src/flux/constants/functions'

const rejoinScript = (scriptLines: string[]): string => {
  return scriptLines.join('\n')
}

const insertAtLine = (
  lineNumber: number,
  scriptLines: string[],
  textToInsert: string,
  insertOnSameLine?: boolean
): string => {
  const front = scriptLines.slice(0, lineNumber)

  const backStartIndex = insertOnSameLine ? lineNumber + 1 : lineNumber
  const back = scriptLines.slice(backStartIndex)

  const updated = [...front, textToInsert, ...back]

  return rejoinScript(updated)
}

const getInsertLineNumber = (
  currentLineNumber: number,
  scriptLines: string[]
): number => {
  const currentLine = scriptLines[currentLineNumber]

  // Insert on the current line if its an empty line
  if (!currentLine.trim()) {
    return currentLineNumber
  }

  return currentLineNumber + 1
}

const formatFunctionForInsert = (funcName: string, fluxFunction: string) => {
  switch (funcName) {
    case FROM.name:
    case UNION.name: {
      return `\n${fluxFunction}`
    }
    default:
      return `  |> ${fluxFunction}`
  }
}

const getCursorPosition = (insertLineNumber, formattedFunction): Position => {
  const endOfLine = formattedFunction.length - 1

  return {line: insertLineNumber, ch: endOfLine}
}

export const insertFluxFunction = (
  currentLineNumber: number,
  currentScript: string,
  functionName: string,
  fluxFunction: string
): {updatedScript: string; cursorPosition: Position} => {
  const scriptLines = currentScript.split('\n')
  const insertLineNumber = getInsertLineNumber(currentLineNumber, scriptLines)
  const insertOnSameLine = currentLineNumber === insertLineNumber

  const formattedFunction = formatFunctionForInsert(functionName, fluxFunction)

  const updatedScript = insertAtLine(
    insertLineNumber,
    scriptLines,
    formattedFunction,
    insertOnSameLine
  )

  const updatedCursorPosition = getCursorPosition(
    insertLineNumber,
    formattedFunction
  )

  return {updatedScript, cursorPosition: updatedCursorPosition}
}
