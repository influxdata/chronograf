/**
 * Changes or creates a name variable in the supplied tickscript
 * to be a the newName supplied.
 * @param tickscript tickscript
 * @param newName new name
 * @returns modified tickscript
 */
export default function changeTaskName(
  tickscript: string,
  newName: string
): string {
  return `// TODO change var name to ${newName}\n${tickscript}`
}
