// Libraries
import React, {PureComponent} from 'react'
import _ from 'lodash'

// Components
import {ErrorHandling} from 'src/shared/decorators/errors'
import FetchMeasurements from 'src/flux/components/FetchMeasurements'
import FetchTagKeys from 'src/flux/components/FetchTagKeys'
import FetchFields from 'src/flux/components/FetchFields'

// Types
import {Source, RemoteDataState, TimeRange} from 'src/types'

interface Props {
  bucket: string
  source: Source
  timeRange: TimeRange
  children: (tree: CategoryTree) => JSX.Element
}

interface FieldsByMeasurements {
  [measurement: string]: string[]
}

export interface CategoryTree {
  measurements: {[m: string]: string[]}
  tagKeys: string[]
  fields: string[]
  measurementsLoading: RemoteDataState
  tagsLoading: RemoteDataState
  fieldsLoading: RemoteDataState
}

class SchemaExplorerTree extends PureComponent<Props> {
  public render() {
    const {source, timeRange, bucket} = this.props

    return (
      <FetchMeasurements source={source} timeRange={timeRange} bucket={bucket}>
        {(measurements, measurementsLoading) => (
          <FetchTagKeys source={source} timeRange={timeRange} bucket={bucket}>
            {(tagKeys, tagsLoading) => (
              <FetchFields
                source={source}
                timeRange={timeRange}
                bucket={bucket}
              >
                {(fields, fieldsByMeasurements, fieldsLoading) =>
                  this.props.children(
                    this.tree(
                      measurements,
                      tagKeys,
                      fields,
                      fieldsByMeasurements,
                      measurementsLoading,
                      tagsLoading,
                      fieldsLoading
                    )
                  )
                }
              </FetchFields>
            )}
          </FetchTagKeys>
        )}
      </FetchMeasurements>
    )
  }

  private tree(
    measurements: string[],
    tagKeys: string[],
    fields: string[],
    fieldsByMeasurements,
    measurementsLoading: RemoteDataState,
    tagsLoading: RemoteDataState,
    fieldsLoading: RemoteDataState
  ): CategoryTree {
    return {
      measurements: this.measurementsTree(measurements, fieldsByMeasurements),
      fields,
      tagKeys,
      measurementsLoading,
      tagsLoading,
      fieldsLoading,
    }
  }

  private measurementsTree(
    measurements: string[],
    fieldsByMeasurements: FieldsByMeasurements
  ) {
    const measurementsWithNoFields = _.difference(
      measurements,
      Object.keys(fieldsByMeasurements)
    )

    return measurementsWithNoFields.reduce((acc, m) => {
      acc[m] = []
      return acc
    }, fieldsByMeasurements)
  }
}

export default ErrorHandling(SchemaExplorerTree)
