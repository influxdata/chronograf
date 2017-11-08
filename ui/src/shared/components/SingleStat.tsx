import * as React from 'react'
import * as classnames from 'classnames'
import lastValues from 'shared/parsing/lastValues'

import {SMALL_CELL_HEIGHT} from 'shared/graphs/helpers'

import {TimeSeries} from 'src/types/timeSeries'

export interface SingleStatProps {
  data: TimeSeries[]
  isFetchingInitially: boolean
  cellHeight: number
}

const SingleStat: React.SFC<SingleStatProps> = ({
  data,
  cellHeight,
  isFetchingInitially,
}) => {
  // If data for this graph is being fetched for the first time, show a graph-wide spinner.
  if (isFetchingInitially) {
    return (
      <div className="graph-empty">
        <h3 className="graph-spinner" />
      </div>
    )
  }

  const lastValue = lastValues(data)[1]

  const precision = 100.0
  const roundedValue = Math.round(+lastValue * precision) / precision

  return (
    <div className="single-stat">
      <span
        className={classnames('single-stat--value', {
          'single-stat--small': cellHeight === SMALL_CELL_HEIGHT,
        })}
      >
        {roundedValue}
      </span>
    </div>
  )
}

export default SingleStat
