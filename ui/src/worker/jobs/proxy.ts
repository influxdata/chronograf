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
      return {data: await response.json()}
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
    Promise.reject(response.statusText || `error ${response.status}`)
  } catch (e) {
    console.error('failed to POST url:', url, 'body:', body, 'error:', e)
    return Promise.reject(e.message ? e.message : String(e))
  }
}

export default proxy
