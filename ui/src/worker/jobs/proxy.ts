interface ProxyMsg {
  payload: {
    url: string
    query: string
    rp?: string
    db?: string
    uuid?: string
  }
}
const proxy = async (msg: ProxyMsg): Promise<{data: any}> => {
  const {
    payload: {url, query, rp, db, uuid},
  } = msg
  const body = {url, query, rp, db, uuid}
  try {
    const response = await fetch(url, {
      method: 'POST',
      body: JSON.stringify(body),
    })
    if (response.ok) {
      return {data: response.status === 204 ? '' : await response.json()}
    }
    const data = await response.text()
    console.error(
      'failed to POST url:',
      url,
      'body:',
      body,
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
    return Promise.reject(errorMessage)
  } catch (e) {
    console.error('failed to POST url:', url, 'body:', body, 'error:', e)
    return Promise.reject(e.message ? e.message : String(e))
  }
}

export default proxy
