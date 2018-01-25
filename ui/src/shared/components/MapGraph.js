import React, {PropTypes, Component} from 'react'
import Mapbox from 'shared/components/Mapbox'
import _ from 'lodash'

import SingleStat from 'src/shared/components/SingleStat'
import timeSeriesToDygraph from 'utils/timeSeriesToDygraph'

import {SINGLE_STAT_LINE_COLORS} from 'src/shared/graphs/helpers'

class MapGraph extends Component {
  constructor(props) {
    super(props)
    this.state = {
        data_keys:['key1','name2']
    //   data_past: []
    }
  }

  componentWillMount() {
    const {data} = this.props
    // do something to data here
    const dataAll= data[0].response.results[0].series
    // const dataAll = [{"name":"1","columns":["_time","lat","lon"],"tags":{"hwid":"a"},"values":[[1516841493,0,0],[1516841494,10,10],[1516841495,20,20]]},{"name":"2","columns":["_time","lat","lon"],"tags":{"hwid":"b"},"values":[[1516841493,0,0],[1516841494,0,10],[1516841495,0,20]]},{"name":"3","columns":["_time","lat","lon"],"tags":{"hwid":"c"},"values":[[1516841493,0,0],[1516841494,10,0],[1516841495,20,0]]}]

    const data_past=_.reduce(dataAll, (r, v)=>{
        const vals = v.values
        const mappedvals= _.map(vals, (arr)=>[arr[1],arr[2]])
        r.push(mappedvals)
        return r
    }, [])
    this.setState({data_past})
  }

  render() {
    const {data_past} = this.state
    return (
      <Mapbox
        lat={0}
        lng={0}
        zoom={1}
        data_past={data_past}
      />
    )
  }
}

const {array, arrayOf, bool, func, number, shape, string} = PropTypes

MapGraph.propTypes = {}

export default MapGraph
