import {Message} from 'src/worker/types'
import {fetchData} from 'src/worker/utils'
import {MAX_RESPONSE_BYTES} from 'src/flux/constants'

interface DecodeFluxRespWithLimitResult {
  body: string
  byteLength: number
  ok: boolean
  uuid?: string
}

export default async (msg: Message): Promise<DecodeFluxRespWithLimitResult> => {
  const {url, query, uuid, dialect} = await fetchData(msg)

  const body = JSON.stringify({
    query,
    dialect: dialect || {annotations: ['group', 'datatype', 'default']},
    uuid,
  })

  const response = await fetch(url, {
    method: 'POST',
    body,
    headers: {'Content-Type': 'application/json'},
  })

  const reader = response.body.getReader()
  const decoder = new TextDecoder()

  let bytesRead = 0
  let bodyString = ''
  let currentRead = await reader.read()

  while (!currentRead.done) {
    const currentText = decoder.decode(currentRead.value)

    bytesRead += currentRead.value.byteLength

    if (bytesRead >= MAX_RESPONSE_BYTES) {
      // Discard last line since it may be partially read
      const lines = currentText.split('\n')
      bodyString += lines.slice(0, lines.length - 1).join('\n')

      reader.cancel()

      return {body: bodyString, byteLength: bytesRead, ok: response.ok, uuid}
    } else {
      bodyString += currentText
    }

    currentRead = await reader.read()
  }

  reader.cancel()

  return {body: bodyString, byteLength: bytesRead, ok: response.ok, uuid}
}
