const excludedStatements: string[] = [
  'drop',
  'delete',
  'alter',
  'create',
  'grant',
  'revoke',
  'use',
]

export const isExcludedStatement = (query: string): boolean => {
  return excludedStatements.some(statement =>
    query?.toLowerCase().startsWith(statement)
  )
}
