import {getAST} from 'src/shared/apis/flux/ast'

export const extractImports = async (
  url: string,
  query: string
): Promise<{imports: string; body: string}> => {
  const ast = await getAST({url, body: query})
  const {imports, body} = ast.files[0]
  const importStatements = (imports || [])
    .map(i => i.location.source)
    .join('\n')
  const bodyStatements = (body || []).map(b => b.location.source).join('\n')
  return {imports: importStatements, body: bodyStatements}
}
