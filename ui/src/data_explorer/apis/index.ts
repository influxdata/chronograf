import AJAX from 'src/utils/ajax'
import {Source} from 'src/types'

export const writeLineProtocol = async (
  source: Source,
  db: string,
  data: string,
  precision?: string
): Promise<void> => {
  const url = `${source.links.write}?db=${db}&precision=${
    precision ? precision : 'ns'
  }`
  await AJAX({url, method: 'POST', data})
}
