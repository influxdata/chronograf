import {manager} from 'src/worker/JobManager'

interface ProxyQuery {
  source: string
  query: string
  db?: string
  rp?: string
  uuid?: string
}

export async function proxy<T = any>({
  source,
  query,
  db,
  rp,
  uuid,
}: ProxyQuery) {
  try {
    const result = await manager.proxy(source, query, db, rp, uuid)
    return result as T
  } catch (error) {
    console.error(error)
    throw error
  }
}
