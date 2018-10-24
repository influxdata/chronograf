// Libraries
import {get} from 'lodash'
import uuid from 'uuid'

// Utilities
import {parseResponse} from 'src/shared/parsing/flux/response'
import {manager} from 'src/worker/JobManager'

// Constants
import {MAX_RESPONSE_BYTES} from 'src/flux/constants'

// Types
import {Source, FluxTable} from 'src/types'

export interface GetRawTimeSeriesResult {
  didTruncate: boolean
  csv: string
  ok: boolean
  uuid?: string
}

// Returns the CSV file directly from the Flux service
export const getRawTimeSeries = async (
  source: Source,
  script: string,
  requestUUID: string = uuid.v4()
): Promise<GetRawTimeSeriesResult> => {
  const path = encodeURIComponent(`/api/v2/query?organization=defaultorgname`)
  const url = `${window.basepath}${source.links.flux}?path=${path}`

  try {
    const {body, byteLength, ok} = await manager.fetchFluxData(
      url,
      script,
      requestUUID
    )

    return {
      csv: body,
      didTruncate: byteLength >= MAX_RESPONSE_BYTES,
      ok,
      uuid: requestUUID,
    }
  } catch (error) {
    console.error('Could not fetch Flux data', error)

    const headerError = error.headers ? error.headers['x-incl'] : null
    const bodyError = error.data ? error.data.message : null
    const fallbackError = 'unknown error 🤷'

    throw new Error(headerError || bodyError || fallbackError)
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
  source,
  script: string,
  requestUUID: string = uuid.v4()
): Promise<GetTimeSeriesResult> => {
  const {csv, didTruncate, ok} = await getRawTimeSeries(
    source,
    script,
    requestUUID
  )

  if (!ok) {
    // error will be string of {error: value}
    const error = get(JSON.parse(csv), 'error', '')

    throw new Error(error)
  }

  const tables = parseResponse(csv)
  const response = {
    tables,
    csv,
    didTruncate,
    uuid: requestUUID,
  }

  return response
}
