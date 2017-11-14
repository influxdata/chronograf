import AJAX from 'utils/ajax'
import {Template} from 'src/types'

export const proxy = async ({
  source,
  query,
  db,
  rp,
  tempVars,
  resolution,
}: {
  source: string
  query: string
  db: string
  rp?: string
  tempVars?: Template[]
  resolution?: number
}) => {
  try {
    return await AJAX({
      method: 'POST',
      url: source,
      data: {
        tempVars,
        query,
        resolution,
        db,
        rp,
      },
    })
  } catch (error) {
    console.error(error)
    throw error
  }
}
