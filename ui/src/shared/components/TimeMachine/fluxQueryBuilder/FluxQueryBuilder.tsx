// Libraries
import React, {useEffect, useState} from 'react'

import BuilderCard from './BuilderCard'
import BucketsSelector from './BucketsSelector'
import FancyScrollbar from '../../FancyScrollbar'
import {RemoteDataState, Source} from 'src/types'
import {getBuckets} from 'src/flux/components/DatabaseList'
import {
  Button,
  ButtonShape,
  ComponentColor,
  ComponentSize,
  IconFont,
} from 'src/reusable_ui'
import AggregationSelector from './AggregationSelector'
import TagSelector from './TagSelector'

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

  // TODO demo selectors are to be replaced by a real implementation
  const [tagSelectors, setTagSelectors] = useState(0)
  const [activeTagSelectors, setActiveTagSelectors] = useState([] as number[])

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
            {activeTagSelectors.map(i => (
              <TagSelector
                key={i}
                index={i}
                onRemoveTagSelector={ix =>
                  setActiveTagSelectors(
                    activeTagSelectors.filter(x => x !== ix)
                  )
                }
              />
            ))}
            <Button
              size={ComponentSize.Large}
              customClass="flux-query-builder--add-card-button"
              icon={IconFont.PlusSkinny}
              onClick={() => {
                setActiveTagSelectors([...activeTagSelectors, tagSelectors])
                setTagSelectors(tagSelectors + 1)
              }}
              shape={ButtonShape.Square}
            />
          </div>
        </FancyScrollbar>
        <AggregationSelector>
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
        </AggregationSelector>
      </div>
    </div>
  )
}

export default FluxQueryBuilder
