import * as React from 'react'
import * as PropTypes from 'prop-types'

import AlertsApp from 'alerts/containers/AlertsApp'
import NewsFeed from 'status/components/NewsFeed'
import GettingStarted from 'status/components/GettingStarted'

import {RECENT_ALERTS_LIMIT} from 'status/constants'

const WidgetCell = ({cell, source, timeRange}) => {
  switch (cell.type) {
    case 'alerts': {
      return (
        <AlertsApp
          source={source}
          timeRange={timeRange}
          isWidget={true}
          limit={RECENT_ALERTS_LIMIT}
        />
      )
    }
    case 'news': {
      return <NewsFeed source={source} />
    }
    case 'guide': {
      return <GettingStarted />
    }
    default: {
      return (
        <div className="graph-empty">
          <p data-test="data-explorer-no-results">Nothing to show</p>
        </div>
      )
    }
  }
}

const {shape, string} = PropTypes

WidgetCell.propTypes = {
  timeRange: shape({
    lower: string,
    upper: string,
  }),
  source: shape({}),
  cell: shape({}),
}

export default WidgetCell
