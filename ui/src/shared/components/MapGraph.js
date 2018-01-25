import React, {PropTypes, Component} from 'react'
import Mapbox from 'shared/components/Mapbox'

import SingleStat from 'src/shared/components/SingleStat'
import timeSeriesToDygraph from 'utils/timeSeriesToDygraph'

import {SINGLE_STAT_LINE_COLORS} from 'src/shared/graphs/helpers'

class MapGraph extends Component {
  constructor(props) {
    super(props)
    this.state = {
      data_past: {},
      data_current: {},
    }
  }

  componentWillMount() {
    const {data} = this.props
    // do something to data here
    const data_past = data
    const data_current = data
    this.setState({data_past, data_current})
  }

  render() {
    const {data_past, data_current} = this.state
    console.log(this.props.data)
    return (
      <Mapbox
        lat={0}
        lng={0}
        zoom={1}
        data_past={data_past}
        data_current={data_current}
      />
    )
  }
}

const {array, arrayOf, bool, func, number, shape, string} = PropTypes

MapGraph.propTypes = {}

export default MapGraph
