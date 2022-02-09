// Libraries
import React, {useEffect, useMemo} from 'react'
import {connect} from 'react-redux'
import classnames from 'classnames'

// Components
import BuilderCard from './BuilderCard'

// Types
import {RemoteDataState} from 'src/types'
import {BucketSelectorState, TimeMachineQueryProps} from './types'
import {loadBucketsThunk, selectBucketThunk} from './actions/thunks'
import {setBucketsSearchTerm} from './actions/buckets'

interface Callbacks {
  onFilterBuckets: typeof setBucketsSearchTerm
  onSelectBucket: typeof selectBucketThunk
  onLoadBuckets: typeof loadBucketsThunk
}
type Props = TimeMachineQueryProps & BucketSelectorState & Callbacks

const filterBuckets = (buckets: string[], term: string): string[] => {
  const searchTerm = term.toLocaleLowerCase()
  let list = buckets.filter((bucket: string) =>
    bucket.toLocaleLowerCase().includes(searchTerm)
  )
  if (list.length > 200) {
    list = list.slice(0, 200)
  }

  return list
}

const BucketsSelector = ({
  source,
  timeRange,
  selectedBucket,
  buckets: passedBuckets,
  status,
  searchTerm,
  onSelectBucket,
  onFilterBuckets,
}: Props) => {
  if (status === RemoteDataState.Done) {
    if (!passedBuckets.length) {
      return (
        <BuilderCard.Empty>
          <i>No buckets found</i>
        </BuilderCard.Empty>
      )
    }
    const buckets = useMemo(() => {
      return filterBuckets(passedBuckets, searchTerm)
    }, [passedBuckets, searchTerm])

    return (
      <>
        <BuilderCard.Menu>
          <input
            className="form-control input-sm"
            placeholder="Search for a bucket"
            type="text"
            value={searchTerm}
            onChange={e => onFilterBuckets(e.target.value)}
            onKeyUp={e => {
              if (e.key === 'Escape') {
                e.stopPropagation()
                onFilterBuckets('')
              }
            }}
            spellCheck={false}
            autoComplete="false"
          />
        </BuilderCard.Menu>
        <BuilderCard.Body>
          <div className="flux-query-builder--list">
            {buckets.map(bucket => (
              <div
                className={classnames('flux-query-builder--list-item', {
                  active: bucket === selectedBucket,
                })}
                onClick={() => onSelectBucket(source, timeRange, bucket, true)}
                key={bucket}
              >
                {bucket}
              </div>
            ))}
          </div>
        </BuilderCard.Body>
      </>
    )
  }
  if (status === RemoteDataState.Error) {
    return (
      <BuilderCard.Empty>
        <i>Failed to load buckets</i>
      </BuilderCard.Empty>
    )
  }
  return (
    <BuilderCard.Empty>
      <i>Loading Buckets</i>
    </BuilderCard.Empty>
  )
}

const InitializeBucketsSelector = (props: Props) => {
  useEffect(() => {
    props.onLoadBuckets(props.source, props.timeRange)
  }, [props.source, props.timeRange])

  return <BucketsSelector {...props}></BucketsSelector>
}
const mstp = (state: any): BucketSelectorState => {
  return state?.fluxQueryBuilder?.buckets as BucketSelectorState
}
const mdtp: Callbacks = {
  onLoadBuckets: loadBucketsThunk,
  onFilterBuckets: setBucketsSearchTerm,
  onSelectBucket: selectBucketThunk,
}
const connector = connect(mstp, mdtp)
export default connector(InitializeBucketsSelector)
