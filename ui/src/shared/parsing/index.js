import _ from 'lodash'

import databases from 'shared/parsing/showDatabases'
import measurements from 'shared/parsing/showMeasurements'
import fieldKeys from 'shared/parsing/showFieldKeys'
import tagKeys from 'shared/parsing/showTagKeys'
import tagValues from 'shared/parsing/showTagValues'
import {getDeep} from 'src/utils/wrappers'

import {TimeSeriesResponse} from 'src/types/series'

const parsers = {
  databases,
  measurements: data => {
    const {errors, measurementSets} = measurements(data)
    return {
      errors,
      measurements: _.get(measurementSets, ['0', 'measurements'], []),
    }
  },
  fieldKeys: (data, key) => {
    const {errors, fieldSets} = fieldKeys(data)
    return {errors, fieldKeys: _.get(fieldSets, key, [])}
  },
  tagKeys,
  tagValues: (data, key) => {
    const {errors, tags} = tagValues(data)
    return {errors, tagValues: _.get(tags, key, [])}
  },
}

export const extractQueryWarningMessage = (
  data: TimeSeriesResponse
): string | null => {
  const error = getDeep(data, 'results.0.error', null)
  const series = getDeep(data, 'results.0.series', null)

  if (error) {
    return error
  }

  if (!series) {
    return 'Your query is syntactically correct but returned no results'
  }

  return null
}

export const extractQueryErrorMessage = (errorMessage: string): string => {
  if (!errorMessage) {
    return 'Could not retrieve data'
  }

  const parseErrorMatch = errorMessage.match('error parsing query')

  if (parseErrorMatch) {
    return errorMessage.slice(parseErrorMatch.index)
  }

  return errorMessage
}

export default parsers
