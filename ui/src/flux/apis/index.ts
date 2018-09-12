import _ from 'lodash'

import AJAX from 'src/utils/ajax'
import {Service, FluxTable} from 'src/types'
import {updateService} from 'src/shared/apis'
import {
  parseResponse,
  parseResponseError,
} from 'src/shared/parsing/flux/response'
import {MAX_RESPONSE_BYTES} from 'src/flux/constants'
import {manager} from 'src/worker/JobManager'

export const getSuggestions = async (url: string) => {
  try {
    const {data} = await AJAX({
      url,
    })

    return data.funcs
  } catch (error) {
    console.error('Could not get suggestions', error)
    throw error
  }
}

interface ASTRequest {
  url: string
  body: string
}

export const getAST = async (request: ASTRequest) => {
  const {url, body} = request
  try {
    const {data} = await AJAX({
      method: 'POST',
      url,
      data: {body},
    })

    return data
  } catch (error) {
    console.error('Could not parse query', error)
    throw error
  }
}

interface GetTimeSeriesResult {
  didTruncate: boolean
  tables: FluxTable[]
}

export const getTimeSeries = async (
  service: Service,
  script: string
): Promise<GetTimeSeriesResult> => {
  const mark = encodeURIComponent('?')
  const garbage = script.replace(/\s/g, '') // server cannot handle whitespace
  const url = `${window.basepath}${
    service.links.proxy
  }?path=/query${mark}organization=defaultorgname`
  const dialect = {annotations: ['group', 'datatype', 'default']}
  const data = JSON.stringify({
    query: garbage,
    dialect,
  })

  let responseBody: string
  let responseByteLength: number

  try {
    // We are using the `fetch` API here since the `AJAX` utility lacks support
    // for limiting response size. The `AJAX` utility depends on
    // `axios.request` which _does_ have a `maxContentLength` option, though it
    // seems to be broken at the moment. We might use this option instead of
    // the `fetch` API in the future, if it is ever fixed.  See
    // https://github.com/axios/axios/issues/1491.
    const {body, byteLength} = await manager.fetchFluxData(url, data)

    responseBody = body
    responseByteLength = byteLength
  } catch (error) {
    console.error('Problem fetching data', error)

    throw _.get(error, 'headers.x-influx-error', false) ||
      _.get(error, 'data.message', 'unknown error 🤷')
  }

  try {
    return {
      tables: parseResponse(responseBody),
      didTruncate: responseByteLength >= MAX_RESPONSE_BYTES,
    }
  } catch (error) {
    console.error('Could not parse response body', error)

    return {
      tables: parseResponseError(responseBody),
      didTruncate: false,
    }
  }
}

export const updateScript = async (service: Service, script: string) => {
  const updates = {...service, metadata: {script}}

  try {
    const response = await updateService(updates)
    return response
  } catch (error) {
    if (error.data) {
      console.error('Could not update script', error.data)
      throw error.data
    }

    throw error
  }
}
