// Types
import {CancelBox, CancellationError} from 'src/types/promises'
import {Source} from 'src/types'

// the following constants were taken from v2 UI
const FLUX_RESPONSE_BYTES_LIMIT = 27 * 1024 * 1024
const RATE_LIMIT_ERROR_STATUS = 429
const RATE_LIMIT_ERROR_TEXT =
  'Oops. It looks like you have exceeded the query limits allowed as part of your plan. If you would like to increase your query limits, reach out to support@influxdata.com.'

export interface RunQueryResult {
  csv: string
  didTruncate: boolean
  bytesRead: number
}

export class RateLimitError extends Error {
  public retryAfter: number | null

  constructor(retryAfter: number | null) {
    super(RATE_LIMIT_ERROR_TEXT)
    this.retryAfter = retryAfter
    this.name = 'RateLimitError'
  }
}
export class HttpError extends Error {
  public code: number
  public

  constructor(message: string, code?: number) {
    super(message)
    this.code = code
    this.name = 'HttpError'
  }
}

/**
 * Executes a flux query and returns a cancelable result.
 */
export const runQuery = (
  source: Source,
  query: string,
  abortController: AbortController = new AbortController()
): CancelBox<RunQueryResult> => {
  const path = encodeURIComponent(`/api/v2/query?organization=defaultorgname`)
  const url = `${window.basepath}${source.links.flux}?version=${source.version}&path=${path}`
  const dialect = {annotations: ['group', 'datatype', 'default']}

  const headers = {
    'Content-Type': 'application/json',
    'Accept-Encoding': 'gzip',
  }

  const request = fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({query, dialect}),
    signal: abortController.signal,
  })

  const promise = request
    .then(processResponse)
    .catch(e =>
      e.name === 'AbortError'
        ? Promise.reject(new CancellationError())
        : Promise.reject(e)
    )

  return {
    promise,
    cancel: () => abortController.abort(),
  }
}

export const processResponse = async (
  response: Response
): Promise<RunQueryResult> => {
  switch (response.status) {
    case 200:
      return processSuccessResponse(response)
    case RATE_LIMIT_ERROR_STATUS:
      throwRateLimitError(response)
      break
    default:
      throwError(response)
  }
}

const processSuccessResponse = async (
  response: Response
): Promise<RunQueryResult> => {
  const reader = response.body.getReader()
  const decoder = new TextDecoder()

  let csv = ''
  let bytesRead = 0
  let didTruncate = false

  let read = await reader.read()

  while (!read.done) {
    const text = decoder.decode(read.value)

    bytesRead += read.value.byteLength

    if (bytesRead > FLUX_RESPONSE_BYTES_LIMIT) {
      csv += trimPartialLines(text)
      didTruncate = true
      break
    } else {
      csv += text
      read = await reader.read()
    }
  }

  reader.cancel()

  return {
    csv,
    bytesRead,
    didTruncate,
  }
}

const throwRateLimitError = (response: Response): never => {
  const retryAfter = response.headers.get('Retry-After')

  throw new RateLimitError(
    retryAfter !== null ? parseInt(retryAfter, 10) : null
  )
}

const throwError = async (response: Response): Promise<never> => {
  try {
    const body = await response.text()
    const json = JSON.parse(body)
    const message = json.message || json.error
    const code = json.code

    throw new HttpError(message, code)
  } catch {
    let message = 'Failed to execute Flux query'
    if (response.statusText) {
      message += ': ' + response.statusText
    }
    throw new HttpError(message, response.status)
  }
}

/*
  Given an arbitrary text chunk of a Flux CSV, trim partial lines off of the end
  of the text.

  For example, given the following partial Flux response,

            r,baz,3
      foo,bar,baz,2
      foo,bar,b

  we want to trim the last incomplete line, so that the result is

            r,baz,3
      foo,bar,baz,2

*/
const trimPartialLines = (partialResp: string): string => {
  let i = partialResp.length - 1

  while (partialResp[i] !== '\n') {
    if (i <= 0) {
      return partialResp
    }

    i -= 1
  }

  return partialResp.slice(0, i + 1)
}
