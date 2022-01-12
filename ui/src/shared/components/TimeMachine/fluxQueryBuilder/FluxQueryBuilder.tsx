// Libraries
import React, {useEffect, useState} from 'react'

import BuilderCard from './BuilderCard'
import BucketsSelector from './BucketsSelector'
import FancyScrollbar from '../../FancyScrollbar'
import {RemoteDataState, Source} from 'src/types'
import {getBuckets} from 'src/flux/components/DatabaseList'
import {Button, ComponentColor, ComponentSize} from 'src/reusable_ui'

interface State {
  selectedBucket?: string
  sortedBucketNames: string[]
  bucketsStatus: RemoteDataState
}
interface Props {
  source: Source
  onSubmit: () => void
  onShowEditor: () => void
}
const FluxQueryBuilder = ({source, onSubmit, onShowEditor}: Props) => {
  const [state, setState] = useState({
    selectedBucket: '',
    sortedBucketNames: [],
    bucketsStatus: RemoteDataState.Loading,
  } as State)
  useEffect(() => {
    getBuckets(source)
      .then(buckets => {
        setState({
          ...state,
          sortedBucketNames: buckets,
          bucketsStatus: RemoteDataState.Done,
        })
      })
      .catch(e => {
        console.error(e)
        setState({
          ...state,
          bucketsStatus: RemoteDataState.Error,
        })
      })
  }, [])

  const {selectedBucket, sortedBucketNames, bucketsStatus} = state
  return (
    <div className="flux-query-builder" data-testid="flux-query-builder">
      <div className="flux-query-builder--cards">
        <FancyScrollbar>
          <div className="builder-card--list">
            <BuilderCard testID="bucket-selector">
              <BuilderCard.Header title="From" />
              <BucketsSelector
                bucketsStatus={bucketsStatus}
                sortedBucketNames={sortedBucketNames}
                selectedBucket={selectedBucket}
                onSelectBucket={bucket =>
                  setState({...state, selectedBucket: bucket})
                }
              />
            </BuilderCard>
          </div>
        </FancyScrollbar>
        <div className="flux-query-builder--right">
          <div className="flux-query-builder--actions">
            <Button
              size={ComponentSize.ExtraSmall}
              onClick={onShowEditor}
              text="Query Editor"
              titleText="Switch to Flux Query Editor"
            />
            <Button
              size={ComponentSize.ExtraSmall}
              color={ComponentColor.Primary}
              onClick={onSubmit}
              text="Submit"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default FluxQueryBuilder
