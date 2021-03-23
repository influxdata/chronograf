import axios from 'axios'

const proxy = async msg => {
  const {
    payload: {url, query, rp, db, uuid},
  } = msg

  const body = {url, query, rp, db, uuid}
  try {
    const {data} = await axios.post(url, body)

    return {data}
  } catch (e) {
    console.error(
      e.message,
      '; response:',
      e.response?.data,
      '; request:',
      body
    )
    return Promise.reject(e.message)
  }
}

export default proxy
