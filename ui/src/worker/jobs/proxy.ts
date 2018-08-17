const proxy = async msg => {
  const {
    payload: {url, query, rp, db, uuid},
  } = msg

  const response = await fetch(url, {
    method: 'POST',
    body: JSON.stringify({query, rp, db, uuid}),
  })
  const data = await response.json()

  return {data}
}

export default proxy
