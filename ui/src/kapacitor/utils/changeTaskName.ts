const reNameDeclaration = new RegExp(
  // eslint-disable-next-line no-control-regex
  "(?:^|\n)var[ \t]+name[ \t]*=[ \t]*'[^\n]+'\\s*?[\n]"
)

function escapeName(s: string) {
  return s.replace(/['\\]/gi, (str: string): string => '\\' + str)
}

/**
 * Changes or creates a name variable in the supplied tickscript.
 * @param tickscript tickscript
 * @param newName new name
 * @returns modified tickscript with a new name
 */
export default function changeTaskName(
  tickscript: string,
  newName: string
): string {
  const match = tickscript.match(reNameDeclaration)
  if (!match) {
    return `var name = '${escapeName(newName)}'\n${tickscript}`
  }
  let retVal = match.index ? `${tickscript.substring(0, match.index)}\n` : ''
  retVal += `var name = '${escapeName(newName)}'\n${tickscript.substring(
    match.index + match[0].length
  )}`
  return retVal
}
