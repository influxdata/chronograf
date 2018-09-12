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

export interface GetTimeSeriesResult {
  didTruncate: boolean
  tables: FluxTable[]
  uuid?: string
}

export const getTimeSeries = async (
  service: Service,
  script: string,
  uuid?: string
): Promise<GetTimeSeriesResult> => {
  const mark = encodeURIComponent('?')
  const query = script.replace(/\s/g, '') // server cannot handle whitespace
  const url = `${window.basepath}${
    service.links.proxy
  }?path=/query${mark}organization=defaultorgname`
  let responseBody: string
  let responseByteLength: number
  let responseUUID: string
  try {
    const {body, byteLength, uuid: id} = await manager.fetchFluxData(
      url,
      query,
      uuid
    )
    responseBody = body
    responseByteLength = byteLength
    responseUUID = id
  } catch (error) {
    console.error('Problem fetching data', error)

    throw _.get(error, 'headers.x-influx-error', false) ||
      _.get(error, 'data.message', 'unknown error 🤷')
  }

  try {
    const response = {
      tables: parseResponse(responseBody),
      didTruncate: responseByteLength >= MAX_RESPONSE_BYTES,
      uuid: responseUUID,
    }
    return response
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
