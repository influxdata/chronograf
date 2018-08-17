import AJAX from 'src/utils/ajax'

interface ProxyQuery {
  source: string
  query: string
  db?: string
  rp?: string
}

export async function proxy<T = any>({source, query, db, rp}: ProxyQuery) {
  try {
    const resp = await AJAX<T>({
      method: 'POST',
      url: source,
      data: {
        query,
        db,
        rp,
      },
    })

    console.log(`${Date.now()}\treceived data`)

    return resp
  } catch (error) {
    console.error(error)
    throw error
  }
}
