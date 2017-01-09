/* eslint-disable no-magic-numbers */
import React, {PropTypes} from 'react';
import Dygraph from '../../external/dygraph';
import _ from 'lodash';

const {
  array,
  arrayOf,
  number,
  bool,
  shape,
} = PropTypes;

const LINE_COLORS = [
  '#00C9FF',
  '#9394FF',
  '#4ED8A0',
  '#ff0054',
  '#ffcc00',
  '#33aa99',
  '#9dfc5d',
  '#92bcc3',
  '#ca96fb',
  '#ff00f0',
  '#38b94a',
  '#3844b9',
  '#a0725b',
];

export default React.createClass({
  displayName: 'Dygraph',

  propTypes: {
    ranges: shape({
      y: arrayOf(number),
      y2: arrayOf(number),
    }),
    timeSeries: array.isRequired,
    labels: array.isRequired,
    options: shape({}),
    containerStyle: shape({}),
    isGraphFilled: bool,
    overrideLineColors: array,
    dygraphSeries: shape({}).isRequired,
    ruleValues: shape({}),
  },

  getDefaultProps() {
    return {
      containerStyle: {},
      isGraphFilled: true,
      overrideLineColors: null,
    };
  },

  getTimeSeries() {
    // Avoid 'Can't plot empty data set' errors by falling back to a
    // default dataset that's valid for Dygraph.
    return this.props.timeSeries.length ? this.props.timeSeries : [[0]];
  },

  componentDidMount() {
    const timeSeries = this.getTimeSeries();
    // dygraphSeries is a legend label and its corresponding y-axis e.g. {legendLabel1: 'y', legendLabel2: 'y2'};
    const {ranges, dygraphSeries, ruleValues} = this.props;

    const refs = this.refs;
    const graphContainerNode = refs.graphContainer;
    const legendContainerNode = refs.legendContainer;
    const markerNode = refs.graphVerticalMarker;
    let finalLineColors = this.props.overrideLineColors;

    if (finalLineColors === null) {
      finalLineColors = LINE_COLORS;
    }

    const defaultOptions = {
      labelsSeparateLines: false,
      labelsDiv: legendContainerNode,
      labelsKMB: true,
      rightGap: 0,
      leftGap: 0,
      highlightSeriesBackgroundAlpha: 1,
      fillGraph: this.props.isGraphFilled,
      axisLineWidth: 2,
      gridLineWidth: 1,
      highlightCircleSize: 3,
      colors: finalLineColors,
      series: dygraphSeries,
      axes: {
        y: {
          valueRange: getRange(timeSeries, ranges.y, _.get(ruleValues, 'value', null), _.get(ruleValues, 'rangeValue', null)),
        },
        y2: {
          valueRange: getRange(timeSeries, ranges.y2),
        },
      },
      highlightSeriesOpts: {
        strokeWidth: 2,
        highlightCircleSize: 5,
      },
      highlightCallback(e, x, points) {
        // Move the Legend on hover
        const graphRect = graphContainerNode.getBoundingClientRect();
        const legendRect = legendContainerNode.getBoundingClientRect();
        const graphWidth = graphRect.width + 32; // Factoring in padding from parent
        const legendWidth = legendRect.width;
        const legendMaxLeft = graphWidth - (legendWidth / 2);
        const trueGraphX = (e.pageX - graphRect.left);
        let legendLeft = trueGraphX;
        // Enforcing max & min legend offsets
        if (trueGraphX < (legendWidth / 2)) {
          legendLeft = legendWidth / 2;
        } else if (trueGraphX > legendMaxLeft) {
          legendLeft = legendMaxLeft;
        }

        legendContainerNode.style.left = `${legendLeft}px`;
        setMarker(points);
      },
      unhighlightCallback() {
        removeMarker();
      },
    };

    const options = Object.assign({}, defaultOptions, this.props.options);

    this.dygraph = new Dygraph(graphContainerNode, timeSeries, options);

    function setMarker(points) {
      markerNode.style.left = `${points[0].canvasx}px`;
      markerNode.style.display = 'block';
    }

    function removeMarker() {
      markerNode.style.display = 'none';
    }
  },

  componentWillUnmount() {
    this.dygraph.destroy();
    delete this.dygraph;
  },

  componentDidUpdate() {
    const dygraph = this.dygraph;
    if (!dygraph) {
      throw new Error('Dygraph not configured in time; this should not be possible!');
    }

    const timeSeries = this.getTimeSeries();
    const {labels, ranges, options, dygraphSeries, ruleValues} = this.props;

    dygraph.updateOptions({
      labels,
      file: timeSeries,
      axes: {
        y: {
          valueRange: getRange(timeSeries, ranges.y, _.get(ruleValues, 'value', null), _.get(ruleValues, 'rangeValue', null)),
        },
        y2: {
          valueRange: getRange(timeSeries, ranges.y2),
        },
      },
      underlayCallback: options.underlayCallback,
      series: dygraphSeries,
    });

    dygraph.resize();
  },

  render() {
    return (
      <div ref="self">
        <div ref="graphContainer" style={this.props.containerStyle} />
        <div className="container--dygraph-legend" ref="legendContainer" />
        <div className="graph-vertical-marker" ref="graphVerticalMarker" />
      </div>
    );
  },
});

const PADDING_FACTOR = 0.1;

function getRange(timeSeries, override, value = null, rangeValue = null) {
  if (override) {
    return override;
  }

  const subtractPadding = (val) => +val - val * PADDING_FACTOR;
  const addPadding = (val) => +val + val * PADDING_FACTOR;

  const pad = (val, side) => {
    if (val === null || val === '') {
      return null;
    }

    if (val < 0) {
      return side === "top" ? subtractPadding(val) : addPadding(val);
    }

    return side === "top" ? addPadding(val) : subtractPadding(val);
  };

  const points = [
    ...timeSeries,
    [null, pad(value)],
    [null, pad(rangeValue, "top")],
  ];

  const range = points.reduce(([min, max], series) => {
    for (let i = 1; i < series.length; i++) {
      const val = series[i];

      if (max === null) {
        max = val;
      }

      if (min === null) {
        min = val;
      }

      if (typeof val === "number") {
        min = Math.min(min, val);
        max = Math.max(max, val);
      }

      return [min, max];
    }
  }, [null, null]);

  // Dygraph will not reliably plot X / Y axis labels if min and max are both 0
  if (range[0] === 0 && range[1] === 0) {
    return [null, null];
  }

  return range;
}
