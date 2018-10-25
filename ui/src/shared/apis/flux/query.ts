import Deferred from 'src/worker/Deferred'
import {Source} from 'src/types'

const CHECK_LIMIT_INTERVAL = 200
const MAX_ROWS = 50000

interface ExecuteFluxQueryResult {
  csv: string
  didTruncate: boolean
  rowCount: number
  uuid?: string
}

export const executeQuery = async (
  source: Source,
  query: string,
  uuid?: string
): Promise<ExecuteFluxQueryResult> => {
  // We're using `XMLHttpRequest` directly here rather than through `axios` so
  // that we can poll the response size as it comes back. If the response size
  // is greater than a predefined limit, we close the HTTP connection and
  // return the partial response. We could acheive this more elegantly using
  // `fetch` and the [Streams API][0], but the Streams API is currently behind
  // a feature flag in Firefox.
  //
  // [0]: https://developer.mozilla.org/en-US/docs/Web/API/Streams_API
  const xhr = new XMLHttpRequest()
  const deferred = new Deferred()

  let didTruncate = false
  let rowCount = 0
  let rowCountIndex = 0

  const countNewRows = (): number => {
    // Don't extract this to a non-closure helper, since passing
    // `xhr.responseText` as an argument will be expensive
    if (!xhr.responseText) {
      return 0
    }

    let count = 0

    for (let i = rowCountIndex; i < xhr.responseText.length; i++) {
      if (xhr.responseText[i] === '\n') {
        count++
      }
    }

    return count
  }

  const resolve = () => {
    let csv = xhr.responseText

    if (didTruncate) {
      // Discard the last line in the response since it may be partially read
      csv = csv.slice(0, csv.lastIndexOf('\n'))
    }

    rowCount += countNewRows()

    const result: ExecuteFluxQueryResult = {
      csv,
      didTruncate,
      rowCount,
      uuid,
    }

    deferred.resolve(result)
    clearTimeout(interval)
  }

  const reject = () => {
    let bodyError

    try {
      bodyError = JSON.parse(xhr.responseText).error
    } catch {
      bodyError = null
    }

    const statusError = xhr.statusText
    const fallbackError = 'failed to execute Flux query'

    deferred.reject(new Error(bodyError || statusError || fallbackError))
    clearTimeout(interval)
  }

  const interval = setInterval(() => {
    if (!xhr.responseText) {
      // Haven't received any data yet
      return
    }

    rowCount += countNewRows()
    rowCountIndex = xhr.responseText.length

    if (rowCount < MAX_ROWS) {
      return
    }

    didTruncate = true
    resolve()
    xhr.abort()
  }, CHECK_LIMIT_INTERVAL)

  xhr.onload = () => {
    if (xhr.status === 200) {
      resolve()
    } else {
      reject()
    }
  }

  xhr.onerror = reject

  const path = encodeURIComponent(`/api/v2/query?organization=defaultorgname`)
  const url = `${window.basepath}${source.links.flux}?path=${path}`
  const dialect = {annotations: ['group', 'datatype', 'default']}
  const body = JSON.stringify({query, dialect})

  xhr.open('POST', url)
  xhr.setRequestHeader('Content-Type', 'application/json')
  xhr.send(body)

  return deferred.promise
}
