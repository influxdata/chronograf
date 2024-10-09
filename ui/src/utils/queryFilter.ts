const excludedStatements: string[] = [
  'drop',
  'delete',
  'alter',
  'create',
  'update',
  'insert',
]

export const isExcludedStatement = (query: string): boolean => {
  return excludedStatements.some(statement =>
    query.toLowerCase().startsWith(statement)
  )
}
