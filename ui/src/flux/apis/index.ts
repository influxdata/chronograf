import _ from 'lodash'

import AJAX from 'src/utils/ajax'
import {Service, FluxTable} from 'src/types'
import {updateService} from 'src/shared/apis'
import {parseResponse} from 'src/shared/parsing/flux/response'
import {MAX_RESPONSE_BYTES} from 'src/flux/constants'

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
  const and = encodeURIComponent('&')
  const mark = encodeURIComponent('?')
  const garbage = script.replace(/\s/g, '') // server cannot handle whitespace
  const url = `${
    service.links.proxy
  }?path=/v1/query${mark}orgName=defaulorgname${and}q=${garbage}`

  try {
    // We are using the `fetch` API here since the `AJAX` utility lacks support
    // for limiting response size. The `AJAX` utility depends on
    // `axios.request` which _does_ have a `maxContentLength` option, though it
    // seems to be broken at the moment. We might use this option instead of
    // the `fetch` API in the future, if it is ever fixed.  See
    // https://github.com/axios/axios/issues/1491.
    const resp = await fetch(url, {method: 'POST'})
    const {body, byteLength} = await decodeFluxRespWithLimit(resp)

    return {
      tables: parseResponse(body),
      didTruncate: byteLength >= MAX_RESPONSE_BYTES,
    }
  } catch (error) {
    console.error('Problem fetching data', error)

    throw _.get(error, 'headers.x-influx-error', false) ||
      _.get(error, 'data.message', 'unknown error 🤷')
  }
}

// TODO: replace with actual requests to Flux daemon
export const getDatabases = async () => {
  try {
    const response = {data: {dbs: ['telegraf', 'chronograf', '_internal']}}
    const {data} = await Promise.resolve(response)

    return data.dbs
  } catch (error) {
    console.error('Could not get databases', error)
    throw error
  }
}

export const getTags = async () => {
  try {
    const response = {data: {tags: ['tk1', 'tk2', 'tk3']}}
    const {data} = await Promise.resolve(response)
    return data.tags
  } catch (error) {
    console.error('Could not get tags', error)
    throw error
  }
}

export const getTagValues = async () => {
  try {
    const response = {data: {values: ['tv1', 'tv2', 'tv3']}}
    const {data} = await Promise.resolve(response)
    return data.values
  } catch (error) {
    console.error('Could not get tag values', error)
    throw error
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

interface DecodeFluxRespWithLimitResult {
  body: string
  byteLength: number
}

const decodeFluxRespWithLimit = async (
  resp: Response
): Promise<DecodeFluxRespWithLimitResult> => {
  const reader = resp.body.getReader()
  const decoder = new TextDecoder()

  let bytesRead = 0
  let body = ''
  let currentRead = await reader.read()

  while (!currentRead.done) {
    const currentText = decoder.decode(currentRead.value)

    bytesRead += currentRead.value.byteLength

    if (bytesRead >= MAX_RESPONSE_BYTES) {
      // Discard last line since it may be partially read
      const lines = currentText.split('\n')
      body += lines.slice(0, lines.length - 1).join('\n')

      reader.cancel()

      return {body, byteLength: bytesRead}
    } else {
      body += currentText
    }

    currentRead = await reader.read()
  }

  reader.cancel()

  return {body, byteLength: bytesRead}
}
