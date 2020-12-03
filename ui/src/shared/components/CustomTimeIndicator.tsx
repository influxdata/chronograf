import React, {FunctionComponent} from 'react'
import _ from 'lodash'

import {TEMP_VAR_DASHBOARD_TIME} from 'src/shared/constants'
import {QueryConfig} from 'src/types/queries'

interface Query {
  queryConfig: QueryConfig
  text?: string
}

interface Props {
  queries: Query[]
}

const CustomTimeIndicator: FunctionComponent<Props> = ({queries}) => {
  const q = queries.find(
    query =>
      _.get(query, 'text', '').includes(TEMP_VAR_DASHBOARD_TIME) === false
  )
  const customLower = _.get(q, ['queryConfig', 'range', 'lower'], null)
  const customUpper = _.get(q, ['queryConfig', 'range', 'upper'], null)

  if (!customLower) {
    return null
  }

  const customTimeRange = customUpper
    ? `${customLower} AND ${customUpper}`
    : customLower

  return <span className="custom-indicator">{customTimeRange}</span>
}

export default CustomTimeIndicator
