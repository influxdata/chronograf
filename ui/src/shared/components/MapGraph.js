import React, { PropTypes, Component } from "react";
import Mapbox from "shared/components/Mapbox";
import _ from "lodash";

import SingleStat from "src/shared/components/SingleStat";
import timeSeriesToDygraph from "utils/timeSeriesToDygraph";

import { SINGLE_STAT_LINE_COLORS } from "src/shared/graphs/helpers";

class MapGraph extends Component {
  constructor(props) {
    super(props);
    this.state = {
      data_keys: ["key1", "name2"]
    };
  }

  componentWillMount() {
    const { data } = this.props;
    /*const dataAll = [
      {
        name: "1",
        columns: ["_time", "lat", "lon"],
        tags: { hwid: "a" },
        values: [
          [1516841493, 15, 0],
          [1516841494, 10, 10],
          [1516841495, 20, 20]
        ]
      },
      {
        name: "2",
        columns: ["_time", "lat", "lon"],
        tags: { hwid: "b" },
        values: [[1516841493, 2, 3], [1516841494, 0, 10], [1516841495, 0, 22]]
      },
      {
        name: "3",
        columns: ["_time", "lat", "lon"],
        tags: { hwid: "c" },
        values: [
          [1516841493, 5, 0],
          [1516841494, 10, -10],
          [1516841495, 20, 13]
        ]
      }
    ]; //*/
    try {
      console.log(this.props);
      const dataAll = data[0].response.results[0].series;
      data_past = _.reduce(
        dataAll,
        (r, v) => {
          const vals = v.values;
          const mappedvals = _.map(vals, arr => [arr[1], arr[2]]);
          r.push(mappedvals);
          return r;
        },
        []
      );

      data_curr = _.map(data_past, arr => arr[arr.length - 1]);
      this.setState({ data_past, data_curr });
    } catch (e) {
      console.log(e);
    }
  }

  render() {
    const { data_past, data_curr } = this.state;
    return (
      <Mapbox
        lat={0}
        lng={0}
        zoom={1}
        data_past={data_past}
        data_curr={data_curr}
      />
    );
  }
}

const { array, arrayOf, bool, func, number, shape, string } = PropTypes;

MapGraph.propTypes = {};

export default MapGraph;
