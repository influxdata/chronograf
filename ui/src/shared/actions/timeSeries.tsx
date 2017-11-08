import {proxy} from 'utils/queryUrlGenerator'
import {noop} from 'shared/actions/app'
import * as _ from 'lodash'

import {errorThrown} from 'shared/actions/errors'
import {Query} from 'src/types'
import * as FuncTypes from 'src/types/funcs'

export const handleLoading = (query, editQueryStatus) => {
  editQueryStatus(query.id, {loading: true})
}
// {results: [{}]}
export const handleSuccess = (data, query, editQueryStatus) => {
  const {results} = data
  const error = _.get(results, ['0', 'error'], false)
  const series = _.get(results, ['0', 'series'], false)
  // 200 from server and no results = warn
  if (!series && !error) {
    editQueryStatus(query.id, {
      warn: 'Your query is syntactically correct but returned no results',
    })
    return data
  }

  // 200 from chrono server but influx returns an "error" = warning
  if (error) {
    editQueryStatus(query.id, {warn: error})
    return data
  }

  // 200 from server and results contains data = success
  editQueryStatus(query.id, {success: 'Success!'})
  return data
}

export const handleError = (error, query, editQueryStatus) => {
  const message = _.get(error, ['data', 'message'], error.toString())

  // 400 from chrono server = fail
  editQueryStatus(query.id, {error: message})
  console.error(error)
}

export const fetchTimeSeriesAsync = async (
  {source, db, rp, query, tempVars, resolution}: Query,
  editQueryStatus: FuncTypes.editQueryStatus | typeof noop = noop
) => {
  handleLoading(query, editQueryStatus)
  try {
    const {data} = await proxy({
      source,
      db,
      rp,
      query: query.text,
      tempVars,
      resolution,
    })
    return handleSuccess(data, query, editQueryStatus)
  } catch (error) {
    errorThrown(error)
    handleError(error, query, editQueryStatus)
  }
}
