import AJAX from 'src/utils/ajax'

interface ASTRequest {
  url: string
  body: string
}

export const getAST = async (request: ASTRequest) => {
  const {url, body} = request

  const {data, status} = await AJAX({
    method: 'POST',
    url,
    data: {body},
    validateStatus: () => true,
  })

  if (status !== 200) {
    throw new Error('Failed to parse query')
  }

  if (!data.valid) {
    throw new Error(data.error)
  }

  return data.ast
}
