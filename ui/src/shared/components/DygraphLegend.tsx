import * as React from 'react'
import * as _ from 'lodash'
import * as classnames from 'classnames'

import {makeLegendStyles} from 'shared/graphs/helpers'
import {DygraphSeries} from 'src/types'

const removeMeasurement = (label = '') => {
  const [measurement] = label.match(/^(.*)[.]/g) || ['']
  return label.replace(measurement, '')
}

export interface DygraphLegendProps {
  x: number
  xHTML?: string
  series: DygraphSeries[]
  pageX: number
  legend: {}
  graph: {}
  onSnip: () => void
  onHide: (e: {}) => void
  onSort: (sortType: string) => (e: {}) => void
  onInputChange: (e: {}) => void
  onToggleFilter: () => void
  legendRef: (ref: {}) => void
  filterText: string
  isAscending: boolean
  sortType: string
  isHidden: boolean
  isSnipped: boolean
  isFilterVisible: boolean
}

const DygraphLegend: React.SFC<DygraphLegendProps> = ({
  xHTML = '',
  pageX,
  graph,
  legend,
  series,
  onSort,
  onSnip,
  onHide,
  isHidden,
  isSnipped,
  sortType,
  legendRef,
  filterText,
  isAscending,
  onInputChange,
  isFilterVisible,
  onToggleFilter,
}) => {
  const sorted = _.sortBy(
    series,
    ({y, label}) => (sortType === 'numeric' ? y : label)
  )

  const ordered = isAscending ? sorted : sorted.reverse()
  const filtered = ordered.filter(s => s.label.match(filterText))
  const hidden = isHidden ? 'hidden' : ''
  const style = makeLegendStyles(graph, legend, pageX)

  const renderSortAlpha = (
    <div
      className={classnames('sort-btn btn btn-sm btn-square', {
        'btn-primary': sortType !== 'numeric',
        'btn-default': sortType === 'numeric',
        'sort-btn--asc': isAscending && sortType !== 'numeric',
        'sort-btn--desc': !isAscending && sortType !== 'numeric',
      })}
      onClick={onSort('alphabetic')}
    >
      <div className="sort-btn--arrow" />
      <div className="sort-btn--top">A</div>
      <div className="sort-btn--bottom">Z</div>
    </div>
  )
  const renderSortNum = (
    <button
      className={classnames('sort-btn btn btn-sm btn-square', {
        'btn-primary': sortType === 'numeric',
        'btn-default': sortType !== 'numeric',
        'sort-btn--asc': isAscending && sortType === 'numeric',
        'sort-btn--desc': !isAscending && sortType === 'numeric',
      })}
      onClick={onSort('numeric')}
    >
      <div className="sort-btn--arrow" />
      <div className="sort-btn--top">0</div>
      <div className="sort-btn--bottom">9</div>
    </button>
  )

  return (
    <div
      className={`dygraph-legend ${hidden}`}
      ref={legendRef}
      onMouseLeave={onHide}
      style={style}
    >
      <div className="dygraph-legend--header">
        <div className="dygraph-legend--timestamp">{xHTML}</div>
        {renderSortAlpha}
        {renderSortNum}
        <button
          className={classnames('btn btn-square btn-sm', {
            'btn-default': !isFilterVisible,
            'btn-primary': isFilterVisible,
          })}
          onClick={onToggleFilter}
        >
          <span className="icon search" />
        </button>
        <button
          className={classnames('btn btn-sm', {
            'btn-default': !isSnipped,
            'btn-primary': isSnipped,
          })}
          onClick={onSnip}
        >
          Snip
        </button>
      </div>
      {isFilterVisible && (
        <input
          className="dygraph-legend--filter form-control input-sm"
          type="text"
          value={filterText}
          onChange={onInputChange}
          placeholder="Filter items..."
          autoFocus={true}
        />
      )}
      )
      <div className="dygraph-legend--divider" />
      <div className="dygraph-legend--contents">
        {filtered.map(({label, color, yHTML, isHighlighted}) => {
          const seriesClass = isHighlighted
            ? 'dygraph-legend--row highlight'
            : 'dygraph-legend--row'
          return (
            <div key={label + color} className={seriesClass}>
              <span style={{color}}>
                {isSnipped ? removeMeasurement(label) : label}
              </span>
              <figure>{yHTML || 'no value'}</figure>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default DygraphLegend
