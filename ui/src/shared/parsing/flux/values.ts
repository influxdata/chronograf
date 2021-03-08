import _ from 'lodash'

import {FluxTable} from 'src/types'
import {parseResponse} from 'src/shared/parsing/flux/response'

const parseValuesColumn = (resp: string): string[] => {
  const results = parseResponse(resp)

  if (results.length === 0) {
    return []
  }

  const tags = results.reduce<string[]>((acc, result: FluxTable) => {
    const colIndex = result.data[0].findIndex((header) => header === '_value')

    if (colIndex === -1) {
      return [...acc]
    }

    const resultTags = result.data
      .slice(1)
      .map((row) => row[colIndex] as string)

    return [...acc, ...resultTags]
  }, [])

  return _.sortBy(tags, (t) => t.toLocaleLowerCase())
}

export const parseFieldsByMeasurements = (
  resp: string
): {
  fields: string[]
  fieldsByMeasurements: {[measurement: string]: string[]}
} => {
  const results = parseResponse(resp)

  if (results.length === 0) {
    return {fields: [], fieldsByMeasurements: {}}
  }

  return results.reduce(
    (acc, result: FluxTable) => {
      const fieldIndex = result.data[0].findIndex(
        (header) => header === '_field'
      )
      const measurementIndex = result.data[0].findIndex(
        (header) => header === '_measurement'
      )

      if (fieldIndex === -1) {
        return acc
      }

      const data = result.data.slice(1)

      data.forEach((row) => {
        const field = row[fieldIndex]
        if (!acc.fields.includes(field)) {
          acc.fields.push(field)
        }

        if (measurementIndex !== -1) {
          const measurement = row[measurementIndex]
          const existingMeasurementFields =
            acc.fieldsByMeasurements[measurement]

          if (existingMeasurementFields) {
            acc.fieldsByMeasurements[measurement] = [
              ...existingMeasurementFields,
              field,
            ]
          } else {
            acc.fieldsByMeasurements[measurement] = [field]
          }
        }
      })

      return acc
    },
    {fields: [], fieldsByMeasurements: {}}
  )
}

export default parseValuesColumn
