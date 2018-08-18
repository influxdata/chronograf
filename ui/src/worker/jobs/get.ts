import {Message} from 'src/worker/types'

const get = async (msg: Message) => {
  const {
    payload: {url},
  } = msg

  const response = await fetch(url)
  return await response.json()
}

export default get
