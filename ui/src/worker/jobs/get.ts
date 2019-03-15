import {Message} from 'src/worker/types'
import axios from 'axios'

const get = async (msg: Message) => {
  const {
    payload: {url},
  } = msg

  const {data} = await axios.get(url)
  return data
}

export default get
