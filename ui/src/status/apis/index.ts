export const fetchJSONFeed = async (url: string) => {
  const response = await fetch(url, {
    method: 'GET',
    mode: 'cors',
  })

  return response.json()
}
