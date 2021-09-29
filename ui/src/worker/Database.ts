import levelup from 'levelup'
import encoding from 'encoding-down'
import level from 'level-js'

let DB
levelup(encoding(level('worker'), {valueEncoding: 'json'}), (err, db) => {
  DB = db
  if (err) {
    // index DB not available, can happen in private modes
    // eslint-disable-next-line no-console
    console.debug('IndexedDB is not available')
  }
})

interface DBMessage {
  id: string
  payload?: any
}

export const writePayload = async (msg: DBMessage, payload: any) => {
  try {
    if (DB) {
      return DB.put(msg.id, payload)
    }
  } catch (e) {
    // unable to write to DB
  }
  msg.payload = payload
}

export const readPayload = async (msg: DBMessage): Promise<any> => {
  if (msg.payload || !DB) {
    return msg.payload
  }
  const payload = await DB.get(msg.id)
  await DB.del(msg.id)

  return payload
}
