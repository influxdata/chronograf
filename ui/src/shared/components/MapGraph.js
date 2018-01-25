import React, {PropTypes, Component} from 'react'
import Mapbox from 'shared/components/Mapbox'
import shallowCompare from 'react-addons-shallow-compare'

import SingleStat from 'src/shared/components/SingleStat'
import timeSeriesToDygraph from 'utils/timeSeriesToDygraph'

import {SINGLE_STAT_LINE_COLORS} from 'src/shared/graphs/helpers'

class MapGraph extends Component {
  constructor(props) {
    super(props)
  }

  render() {
    return (
      <Mapbox
      lat = {0}
      lng = {0}
      zoom = {1}
      />
    )
  }
}

const {array, arrayOf, bool, func, number, shape, string} = PropTypes

MapGraph.propTypes = {
}

export default MapGraph
