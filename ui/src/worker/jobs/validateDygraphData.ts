import _ from 'lodash'
import {DygraphValue} from 'src/types/dygraphs'
import {fetchData} from 'src/worker/utils'

import {Message} from 'src/worker/types'

const validateDygraphData = async (msg: Message): Promise<boolean> => {
  const ts: DygraphValue[][] = await fetchData(msg)

  return _.every(ts, (r) =>
    _.every(
      r,
      (v: any, i: number) =>
        (i === 0 && Date.parse(v as string)) || _.isNumber(v) || _.isNull(v)
    )
  )
}

export default validateDygraphData
