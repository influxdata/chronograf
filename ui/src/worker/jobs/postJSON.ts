import {Message} from 'src/worker/types'
import {fetchData} from 'src/worker/utils'

export default async (msg: Message): Promise<Response> => {
  const {url, body} = await fetchData(msg)

  const response = await fetch(url, {
    method: 'POST',
    body,
    headers: {'Content-Type': 'application/json'},
  })

  return response
}
