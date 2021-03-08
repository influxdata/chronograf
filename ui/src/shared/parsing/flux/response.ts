import Papa from 'papaparse'
import _ from 'lodash'
import uuid from 'uuid'

import {FluxTable} from 'src/types'

const GROUP_KEY_EXCLUSIONS = []

export const parseResponse = (response: string): FluxTable[] => {
  const chunks = parseChunks(response)
  const tables = chunks.reduce(
    (acc, chunk) => [...acc, ...parseTables(chunk)],
    []
  )

  return tables
}

const parseChunks = (response: string): string[] => {
  const trimmedResponse = response.trim()

  if (_.isEmpty(trimmedResponse)) {
    return []
  }

  // some influxDB versions (docker v1.8.0) return \r\n as a new line separator
  const chunks = trimmedResponse.split(/\r?\n\s*\n/)

  return chunks
}

export const parseTables = (responseChunk: string): FluxTable[] => {
  const lines = responseChunk.split('\n')
  const annotationLines: string = lines
    .filter(line => line.startsWith('#'))
    .join('\n')
  const nonAnnotationLines: string = lines
    .filter(line => !line.startsWith('#'))
    .join('\n')

  if (_.isEmpty(annotationLines)) {
    throw new Error('Unable to extract annotation data')
  }

  if (_.isEmpty(nonAnnotationLines)) {
    // A response may be truncated on an arbitrary line. This guards against
    // the case where a response is truncated on annotation data
    return []
  }

  const nonAnnotationData = Papa.parse(nonAnnotationLines).data
  const annotationData = Papa.parse(annotationLines).data
  const headerRow: string[] = nonAnnotationData[0]

  if (headerRow[1] === 'error' && headerRow[2] === 'reference') {
    throw new Error(_.get(nonAnnotationData, '1.1'))
  }

  const tableColIndex = headerRow.findIndex(h => h === 'table')
  const timeColIndex = headerRow.findIndex(h => h === '_time')

  if (!timeColIndex) {
    throw new Error('Could not find time Column')
  }

  // Group rows by their table id
  const tablesData: Array<Array<Array<string | number>>> = Object.values(
    _.groupBy(nonAnnotationData.slice(1), row => row[tableColIndex])
  )

  const groupRow = annotationData.find(row => row[0] === '#group')
  const defaultsRow = annotationData.find(row => row[0] === '#default')
  const dataTypeRow = annotationData.find(row => row[0] === '#datatype')

  // groupRow = ['#group', 'false', 'true', 'true', 'false']
  const groupKeyIndices = groupRow.reduce((acc, value, i) => {
    if (value === 'true' && !GROUP_KEY_EXCLUSIONS.includes(headerRow[i])) {
      return [...acc, i]
    }

    return acc
  }, [])

  const tables = tablesData.map(tableData => {
    const dataRow = _.get(tableData, '0', defaultsRow)
    const groupKey = groupKeyIndices.reduce((acc, i) => {
      return {...acc, [headerRow[i]]: _.get(dataRow, i, '')}
    }, {})

    const name = Object.entries(groupKey)
      .filter(([k]) => !['_start', '_stop'].includes(k))
      .map(([k, v]) => `${k}=${v}`)
      .join(' ')

    const dataTypes = dataTypeRow.reduce(
      (acc, dataType, i) => ({
        ...acc,
        [headerRow[i]]: dataType,
      }),
      {}
    )

    for (const row of tableData) {
      row[timeColIndex] = new Date(row[timeColIndex]).valueOf()
    }

    const data: Array<Array<string | number>> = [headerRow, ...tableData]

    return {
      id: uuid.v4(),
      data,
      name,
      groupKey,
      dataTypes,
    }
  })

  return tables
}

interface ParseResponseRawResult {
  data: string[][]
  maxColumnCount: number
}

export const parseResponseRaw = (response: string): ParseResponseRawResult => {
  const chunks = parseChunks(response)
  const parsedChunks = chunks.map(c => Papa.parse(c).data)
  const maxColumnCount =
    parsedChunks.length > 0
      ? Math.max(...parsedChunks.map(c => c[0].length))
      : 0
  const data = []

  for (let i = 0; i < parsedChunks.length; i++) {
    if (i !== 0) {
      // Seperate each chunk by an empty line, just like in the unparsed CSV
      data.push([])
    }

    data.push(...parsedChunks[i])

    // Add an empty line at the end
    data.push([])
  }

  return {data, maxColumnCount}
}
