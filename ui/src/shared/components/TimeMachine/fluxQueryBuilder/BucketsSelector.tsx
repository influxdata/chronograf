// Libraries
import React, {useEffect} from 'react'
import {connect} from 'react-redux'
import classnames from 'classnames'

// Components
import BuilderCard from './BuilderCard'

// Types
import {RemoteDataState, Source} from 'src/types'
import {BucketSelectorState} from './types'
import {
  filterBuckets,
  selectBucket,
  changeBucketsState,
} from './actions/buckets'
import {getBuckets} from 'src/flux/components/DatabaseList'
import {bindActionCreators, Dispatch} from 'redux'

interface Callbacks {
  onFilterBuckets: typeof filterBuckets
  onSelectBucket: typeof selectBucket
  onChangeBucketsState: typeof changeBucketsState
}
type Props = BucketSelectorState & Callbacks

const BucketsSelector = ({
  selectedBucket,
  buckets,
  status,
  searchTerm,
  onSelectBucket,
  onFilterBuckets,
}: Props) => {
  if (status === RemoteDataState.Done) {
    if (!buckets.length) {
      return (
        <BuilderCard.Empty>
          {searchTerm ? (
            <i>No buckets matched your search</i>
          ) : (
            <i>No buckets found</i>
          )}
        </BuilderCard.Empty>
      )
    }
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
                onSelectBucket('')
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
                onClick={() => onSelectBucket(bucket)}
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

const InitializeBucketsSelector = (props: {source: Source} & Props) => {
  useEffect(() => {
    props.onChangeBucketsState(RemoteDataState.Loading, [])
    getBuckets(props.source)
      .then(buckets => {
        props.onChangeBucketsState(RemoteDataState.Done, buckets)
      })
      .catch(e => {
        console.error(e)
        props.onChangeBucketsState(RemoteDataState.Error)
      })
  }, [])

  return <BucketsSelector {...props}></BucketsSelector>
}
const mstp = (state: any): BucketSelectorState => {
  return state?.fluxQueryBuilder?.buckets as BucketSelectorState
}
const mdtp = (dispatch: Dispatch<any>): Callbacks => {
  return bindActionCreators(
    {
      onFilterBuckets: filterBuckets,
      onSelectBucket: selectBucket,
      onChangeBucketsState: changeBucketsState,
    },
    dispatch
  )
}
export default connect(mstp, mdtp)(InitializeBucketsSelector)
