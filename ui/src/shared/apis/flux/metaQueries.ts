import _ from 'lodash'

import AJAX from 'src/utils/ajax'
import {Source, SchemaFilter} from 'src/types'
import recordProperty from 'src/flux/helpers/recordProperty'

export const measurements = async (
  source: Source,
  bucket: string
): Promise<any> => {
  const script = `
    import "influxdata/influxdb/v1"
    v1.measurements(bucket:"${bucket}")
    `

  return proxy(source, script)
}

export const fields = async (
  source: Source,
  bucket: string,
  filter: SchemaFilter[],
  limit: number
): Promise<any> => {
  return await tagValues({
    bucket,
    source,
    tagKey: '_field',
    limit,
    filter,
  })
}

// Fetch all the fields and their associated measurement
export const fieldsByMeasurement = async (
  source: Source,
  bucket: string
): Promise<any> => {
  const script = `
  from(bucket: "${bucket}")
    |> range(start: -30d)
    |> group(columns: ["_field", "_measurement"], mode: "by")
    |> distinct(column: "_field")
    |> group()
    |> map(fn: (r) => ({_measurement: r._measurement, _field: r._field}))
  `
  return proxy(source, script)
}

export const tagKeys = async (
  source: Source,
  bucket: string,
  filter: SchemaFilter[]
): Promise<any> => {
  let tagKeyFilter = ''

  if (filter.length) {
    const predicates = filter.map(({key}) => `r._value != "${key}"`)

    tagKeyFilter = `|> filter(fn: (r) => ${predicates.join(' and ')} )`
  }

  const predicate = '(r) => true'

  const script = `
    import "influxdata/influxdb/v1"
    v1.tagKeys(
      bucket: "${bucket}",
      predicate: ${predicate},
      start: -30d,
    )
    ${tagKeyFilter}
    `

  return proxy(source, script)
}

interface TagValuesParams {
  source: Source
  bucket: string
  tagKey: string
  limit: number
  filter?: SchemaFilter[]
  searchTerm?: string
  count?: boolean
}

export const tagValues = async ({
  bucket,
  source,
  tagKey,
  limit,
  searchTerm = '',
  count = false,
}: TagValuesParams): Promise<any> => {
  let regexFilter = ''
  if (searchTerm) {
    regexFilter = `|> filter(fn: (r) => ${recordProperty(
      tagKey
    )} =~ /${searchTerm}/)`
  }

  const limitFunc = count ? '' : `|> limit(n:${limit})`
  const countFunc = count ? '|> count()' : ''

  const predicate = '(r) => true'

  const script = `
    import "influxdata/influxdb/v1"
    v1.tagValues(
      bucket: "${bucket}",
      predicate: ${predicate},
      tag: "${tagKey}",
      start: -30d,
    )
     ${regexFilter}
     ${limitFunc}
     ${countFunc}
  `

  return proxy(source, script)
}

export const tagsFromMeasurement = async (
  source: Source,
  bucket: string,
  measurement: string
): Promise<any> => {
  const script = `
    from(bucket:"${bucket}") 
      |> range(start:-30d) 
      |> filter(fn:(r) => r._measurement == "${measurement}") 
      |> group() 
      |> keys()
      |> keep(columns: ["_value"])
  `

  return proxy(source, script)
}

export const proxy = async (source: Source, script: string) => {
  const mark = encodeURIComponent('?')
  const garbage = script.replace(/\s/g, '') // server cannot handle whitespace
  const dialect = {annotations: ['group', 'datatype', 'default']}
  const data = {query: garbage, dialect}

  try {
    const response = await AJAX({
      method: 'POST',
      url: `${source.links.flux}?path=/api/v2/query${mark}organization=defaultorgname`,
      data,
      headers: {'Content-Type': 'application/json'},
    })

    return response.data
  } catch (error) {
    handleError(error)
  }
}

const handleError = error => {
  console.error('Problem fetching data', error)

  throw _.get(error, 'headers.x-influx-error', false) ||
    _.get(error, 'data.message', 'unknown error 🤷')
}
