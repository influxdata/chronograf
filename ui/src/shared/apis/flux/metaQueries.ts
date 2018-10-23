import {get} from 'lodash'

import AJAX from 'src/utils/ajax'
import {Source, SchemaFilter} from 'src/types'

export const measurements = async (
  source: Source,
  bucket: string
): Promise<any> => {
  const script = `
    from(bucket:"${bucket}") 
        |> range(start:-24h) 
        |> group(by:["_measurement"]) 
        |> distinct(column:"_measurement") 
        |> group()
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

  const script = `
    from(bucket: "${bucket}")
      |> range(start: -30d)
      ${tagsetFilter(filter)}
     	|> group(none: true)
      |> keys(except:["_time", "_value", "_start", "_stop"])
      |> map(fn: (r) => r._value)
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
  filter = [],
  searchTerm = '',
  count = false,
}: TagValuesParams): Promise<any> => {
  let regexFilter = ''

  if (searchTerm) {
    regexFilter = `|> filter(fn: (r) => r.${tagKey} =~ /${searchTerm}/)`
  }

  const limitFunc = count ? '' : `|> limit(n:${limit})`
  const countFunc = count ? '|> count()' : ''

  const script = `
    from(bucket:"${bucket}")
      |> range(start:-1h)
      ${regexFilter}
      ${tagsetFilter(filter)}
      |> group(by:["${tagKey}"])
      |> distinct(column:"${tagKey}")
      |> group(by:["_stop","_start"])
      ${limitFunc}
      ${countFunc}
  `

  return proxy(source, script)
}

const tagsetFilter = (filter: SchemaFilter[]): string => {
  if (!filter.length) {
    return ''
  }

  const predicates = filter.map(({key, value}) => `r.${key} == "${value}"`)

  return `|> filter(fn: (r) => ${predicates.join(' and ')} )`
}

const proxy = async (source: Source, script: string) => {
  try {
    const response = await AJAX({
      method: 'POST',
      url: `${
        source.links.flux
      }?path=/api/v2/query?organization=defaultorgname`,
      data: {
        dialect: {annotations: ['group', 'datatype', 'default']},
        query: script,
      },
      headers: {'Content-Type': 'application/json'},
    })

    return response.data
  } catch (error) {
    console.error('Problem fetching flux data', error)

    const headerError = get(error, 'headers.x-influx-error')
    const bodyError = get(error, 'data.message')
    const fallbackError = 'unknown error 🤷'

    throw new Error(headerError || bodyError || fallbackError)
  }
}
