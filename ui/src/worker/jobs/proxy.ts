const proxy = async msg => {
  const {
    payload: {url, query, rp, db, uuid},
  } = msg

  const response = await fetch(url, {
    method: 'POST',
    body: JSON.stringify({query, rp, db, uuid}),
  })

  const data = await response.json()

  if (!response.ok) {
    let message = 'proxy request failed'

    if (data && data.message) {
      message = data.message
    }

    return Promise.reject(message)
  }

  return {data}
}

export default proxy
