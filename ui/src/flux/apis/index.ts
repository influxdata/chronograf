import AJAX from 'src/utils/ajax'
import {Service, FluxTable} from 'src/types'
import {updateService} from 'src/shared/apis'
import {
  parseResponse,
  parseResponseError,
} from 'src/shared/parsing/flux/response'
import {MAX_RESPONSE_BYTES} from 'src/flux/constants'
import {manager} from 'src/worker/JobManager'
import _ from 'lodash'

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
  const {data, status} = await AJAX({
    method: 'POST',
    url,
    data: {body},
    validateStatus: () => true,
  })

  if (status !== 200) {
    throw new Error('Failed to parse query')
  }

  return data
}

export interface GetRawTimeSeriesResult {
  didTruncate: boolean
  csv: string
  uuid?: string
}

// Returns the CSV file directly from the Flux service
export const getRawTimeSeries = async (
  service: Service,
  script: string,
  uuid?: string
): Promise<GetRawTimeSeriesResult> => {
  const path = encodeURIComponent(`/query?organization=defaultorgname`)
  const url = `${window.basepath}${service.links.proxy}?path=${path}`

  try {
    const {body, byteLength, uuid: responseUUID} = await manager.fetchFluxData(
      url,
      script,
      uuid
    )

    return {
      csv: body,
      didTruncate: byteLength >= MAX_RESPONSE_BYTES,
      uuid: responseUUID,
    }
  } catch (error) {
    console.error('Could not fetch Flux data', error)

    const headerError = error.headers ? error.headers['x-incl'] : null
    const bodyError = error.data ? error.data.message : null
    const fallbackError = 'unknown error 🤷'

    return headerError || bodyError || fallbackError
  }
}

export interface GetTimeSeriesResult {
  didTruncate: boolean
  tables: FluxTable[]
  csv: string
  uuid?: string
}

// Returns a parsed representation of the CSV from the Flux service
export const getTimeSeries = async (
  service: Service,
  script: string,
  uuid?: string
): Promise<GetTimeSeriesResult> => {
  const {csv, didTruncate, uuid: responseUUID} = await getRawTimeSeries(
    service,
    script,
    uuid
  )

  const tables = parseResponse(csv)

  try {
    const response = {
      tables,
      csv,
      didTruncate,
      uuid: responseUUID,
    }

    return response
  } catch (error) {
    console.error('Could not parse response body', error)

    return {
      // REVIEW: Why is this being returned as a `FluxTable[]`?
      csv,
      tables: parseResponseError(csv),
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
