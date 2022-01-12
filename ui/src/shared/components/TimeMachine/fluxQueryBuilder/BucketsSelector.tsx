// Libraries
import React, {useState} from 'react'
import classnames from 'classnames'

// Components
import BuilderCard from './BuilderCard'

// Types
import {RemoteDataState} from 'src/types'

const filterBuckets = (term: string) => {
  const searchTerm = term.toLocaleLowerCase()
  return (bucket: string) => bucket.toLocaleLowerCase().includes(searchTerm)
}

interface Props {
  selectedBucket?: string
  sortedBucketNames: string[]
  bucketsStatus: RemoteDataState
  onSelectBucket: (bucket: string) => void
}

const BucketsSelector = ({
  selectedBucket,
  sortedBucketNames,
  bucketsStatus,
  onSelectBucket,
}: Props) => {
  const [searchTerm, setSearchTerm] = useState('')
  const list = sortedBucketNames.filter(filterBuckets(searchTerm))

  if (bucketsStatus === RemoteDataState.Done) {
    if (!sortedBucketNames.length) {
      return (
        <BuilderCard.Empty>
          <i>No buckets found</i>
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
            onChange={e => setSearchTerm(e.target.value)}
            onKeyUp={e => {
              if (e.key === 'Escape') {
                e.stopPropagation()
                setSearchTerm('')
              }
            }}
            spellCheck={false}
            autoComplete="false"
          />
        </BuilderCard.Menu>
        {list.length ? (
          <BuilderCard.Body>
            <div className="flux-query-builder--list">
              {list.map(bucket => (
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
        ) : (
          <BuilderCard.Empty>No buckets matched your search</BuilderCard.Empty>
        )}
      </>
    )
  }
  if (bucketsStatus === RemoteDataState.Error) {
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

export default BucketsSelector
