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
    let errorMessage = response.statusText || `error ${response.status}`
    // try to parse error message from JSON payload
    if (response.headers.get('content-type').includes('application/json')) {
      try {
        const {message} = JSON.parse(data)
        if (message) {
          errorMessage = message
        }
      } catch (e) {
        // ignore silently, unrecognized error message
      }
    }
    return Promise.reject(new Error(errorMessage))
  } catch (e) {
    console.error('failed to GET url:', url, 'error:', e)
    return Promise.reject(e)
  }
}

export default get
