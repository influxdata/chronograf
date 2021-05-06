import AJAX from 'src/utils/ajax'
import {Source} from 'src/types'

export const writeLineProtocol = async (
  source: Source,
  db: string,
  data: string,
  precision?: string,
  v2?: boolean
): Promise<void> => {
  const url = `${source.links.write}?db=${db}&precision=${
    precision ? precision : 'ns'
  }${v2 ? '&v=2' : ''}`
  await AJAX({url, method: 'POST', data})
}
