import {Message} from '../types'

const get = async (msg: Message): Promise<any> => {
  const {
    payload: {url},
  } = msg
  try {
    const response = await fetch(url, {
      method: 'GET',
    })
    if (response.ok) {
      return response.status === 204 ? '' : await response.json()
    }
    const data = await response.text()
    console.error(
      'failed to GET url:',
      url,
      'status:',
      response.statusText,
      'response:',
      data
    )
    return Promise.reject(
      new Error(response.statusText || `error ${response.status}`)
    )
  } catch (e) {
    console.error('failed to GET url:', url, 'error:', e)
    return Promise.reject(e)
  }
}

export default get
