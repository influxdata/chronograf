import DB from 'src/worker/Database'
import uuid from 'uuid'

import {Message} from 'src/worker/types'

export const removeData = async (msg: Message): Promise<void> => {
  await DB.del(msg.id)
}

export const fetchData = async (msg: Message): Promise<any> => {
  const result = await DB.get(msg.id)

  await removeData(msg)

  return result
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

export const success = async (msg: Message, payload: any) => {
  const id = uuid.v4()

  await DB.put(id, payload)

  postMessage({
    id,
    origin: msg.id,
    result: 'success',
  })
}
