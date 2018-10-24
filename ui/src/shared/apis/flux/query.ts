import {Source, FluxTable, TimeRange} from 'src/types'
import {
  parseResponse,
  parseResponseError,
} from 'src/shared/parsing/flux/response'
import {MAX_RESPONSE_BYTES} from 'src/flux/constants'
import {manager} from 'src/worker/JobManager'
import {renderTemplatesInScript} from 'src/flux/helpers/templates'
import _ from 'lodash'

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
  uuid: string,
  timeRange: TimeRange,
  fluxASTLink: string,
  maxSideLength: number
): Promise<GetRawTimeSeriesResult> => {
  const path = encodeURIComponent(`/api/v2/query?organization=defaultorgname`)
  const url = `${window.basepath}${source.links.flux}?path=${path}`

  const renderedScript = await renderTemplatesInScript(
    script,
    timeRange,
    fluxASTLink,
    maxSideLength
  )

  try {
    const {
      body,
      byteLength,
      ok,
      uuid: responseUUID,
    } = await manager.fetchFluxData(url, renderedScript, uuid)

    return {
      csv: body,
      didTruncate: byteLength >= MAX_RESPONSE_BYTES,
      ok,
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
  source,
  script: string,
  uuid: string,
  timeRange: TimeRange,
  fluxASTLink: string,
  maxSideLength: number
): Promise<GetTimeSeriesResult> => {
  const {csv, didTruncate, ok, uuid: responseUUID} = await getRawTimeSeries(
    source,
    script,
    uuid,
    timeRange,
    fluxASTLink,
    maxSideLength
  )

  if (!ok) {
    // error will be string of {error: value}
    const error = _.get(JSON.parse(csv), 'error', '')
    throw new Error(error)
  }

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
      csv,
      tables: parseResponseError(csv),
      didTruncate: false,
    }
  }
}
