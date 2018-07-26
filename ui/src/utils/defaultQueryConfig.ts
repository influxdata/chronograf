import uuid from 'uuid'

import {FillQueryTypes} from 'src/shared/components/dropdown_fill_query/fillQueryOptions'
import {QueryConfig} from 'src/types'

interface DefaultQueryArgs {
  id?: string
  isKapacitorRule?: boolean
}

const defaultQueryConfig = (
  {id, isKapacitorRule = false}: DefaultQueryArgs = {id: uuid.v4()}
): QueryConfig => {
  const queryConfig = {
    id,
    database: null,
    measurement: null,
    retentionPolicy: null,
    fields: [],
    tags: {},
    groupBy: {
      time: null,
      tags: [],
    },
    areTagsAccepted: true,
    rawText: null,
    status: null,
    shifts: [],
    fill: null,
  }

  return isKapacitorRule
    ? queryConfig
    : {...queryConfig, fill: FillQueryTypes.NullString}
}

export default defaultQueryConfig
