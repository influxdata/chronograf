import levelup from 'levelup'
import encoding from 'encoding-down'
import level from 'level-js'

let DB
levelup(encoding(level('worker'), {valueEncoding: 'json'}), (err, db) => {
  DB = db
  if (err) {
    // can happen in Firefox private mode
    // eslint-disable-next-line no-console
    console.debug('IndexedDB is not available')
  }
})

interface DBMessage {
  id: string
  payload?: any
}

export const writePayload = async (msg: DBMessage, payload: any) => {
  if (DB) {
    try {
      await DB.put(msg.id, payload)
      return
    } catch (e) {
      console.error('Unable to write to IndexedDB', e)
    }
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
