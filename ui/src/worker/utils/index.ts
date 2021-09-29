import {readPayload, writePayload} from 'src/worker/Database'
import uuid from 'uuid'

import {Message} from 'src/worker/types'

export const fetchData = async (msg: Message): Promise<any> => {
  return readPayload(msg)
}

export const error = (msg: Message, err: Error) => {
  const id = uuid.v4()

  postMessage({
    id,
    origin: msg.id,
    result: 'error',
    error: err.toString(),
  })
}

export const success = async (originMsg: Message, payload: any) => {
  const msg = {
    id: uuid.v4(),
    origin: originMsg.id,
    result: 'success',
  }
  writePayload(msg, payload)

  postMessage(msg)
}
