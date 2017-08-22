import React, {PropTypes} from 'react'
import classnames from 'classnames'
import shallowCompare from 'react-addons-shallow-compare'
import lastValues from 'shared/parsing/lastValues'

const SMALL_CELL_HEIGHT = 1

export default React.createClass({
  displayName: 'LineGraph',
  propTypes: {
    data: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
    title: PropTypes.string,
    isFetchingInitially: PropTypes.bool,
    cellHeight: PropTypes.number,
  },

  shouldComponentUpdate(nextProps, nextState) {
    return shallowCompare(this, nextProps, nextState)
  },

  render() {
    const {data, cellHeight} = this.props

    // If data for this graph is being fetched for the first time, show a graph-wide spinner.
    if (this.props.isFetchingInitially) {
      return (
        <div className="graph-empty">
          <h3 className="graph-spinner" />
        </div>
      )
    }

    const meanValue = lastValues(data)

    const precision = 100.0
    const roundedValue = Math.round(meanValue * precision) / precision

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
  },
})
