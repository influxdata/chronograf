import React, {PropTypes} from 'react';
import _ from 'lodash';
import {proxy, buildInfluxUrl} from 'utils/queryUrlGenerator';

function _fetchTimeSeries(host, database, query, clusterID) {
  const url = buildInfluxUrl({
    host,
    database,
    statement: query,
  });

  return proxy(url, clusterID);
}

export default function AutoRefresh(ComposedComponent) {
  const wrapper = React.createClass({
    displayName: `AutoRefresh_${ComposedComponent.displayName}`,
    propTypes: {
      children: PropTypes.element,
      autoRefresh: PropTypes.number,
      queries: PropTypes.arrayOf(PropTypes.shape({
        host: PropTypes.oneOfType([PropTypes.string, PropTypes.arrayOf(PropTypes.string)]),
        text: PropTypes.string,
      }).isRequired).isRequired,
      clusterID: PropTypes.string.isRequired,
    },
    getInitialState() {
      return {timeSeries: []};
    },
    componentDidMount() {
      const {queries} = this.props;
      this.executeQueries(queries);
      if (this.props.autoRefresh) {
        this.intervalID = setInterval(() => this.executeQueries(queries), this.props.autoRefresh);
      }
    },
    componentWillReceiveProps(nextProps) {
      const shouldRefetch = this.queryDifference(this.props.queries, nextProps.queries).length;

      if (shouldRefetch) {
        this.executeQueries(nextProps.queries);
      }

      if ((this.props.autoRefresh !== nextProps.autoRefresh) || shouldRefetch) {
        clearInterval(this.intervalID);

        if (nextProps.autoRefresh) {
          this.intervalID = setInterval(() => this.executeQueries(nextProps.queries), nextProps.autoRefresh);
        }
      }
    },
    queryDifference(left, right) {
      const leftStrs = left.map((q) => `${q.host}${q.text}`);
      const rightStrs = right.map((q) => `${q.host}${q.text}`);
      return _.difference(_.union(leftStrs, rightStrs), _.intersection(leftStrs, rightStrs));
    },
    executeQueries(queries) {
      if (!queries.length) {
        this.setState({
          timeSeries: [],
        });
        return;
      }

      this.setState({isFetching: true});
      let count = 0;
      const newSeries = [];
      queries.forEach(({host, database, text}) => {
        _fetchTimeSeries(host, database, text, this.props.clusterID).then((resp) => {
          newSeries.push({identifier: host, response: resp.data});
          count += 1;
          if (count === queries.length) {
            this.setState({
              isFetching: false,
              timeSeries: newSeries,
            });
          }
        });
      });
    },
    componentWillUnmount() {
      clearInterval(this.intervalID);
    },
    render() {
      const {timeSeries} = this.state;

      if (this.state.isFetching) {
        return this.renderFetching(timeSeries);
      }

      if (this._noResultsForQuery(timeSeries)) {
        return this.renderNoResults();
      }

      return (
        <ComposedComponent
          {...this.props}
          data={timeSeries}
        />
      );
    },

    /**
     * Graphs can potentially show mulitple kinds of spinners based on whether
     * a graph is being fetched for the first time, or is being refreshed.
     */
    renderFetching(data) {
      const isFirstFetch = !Object.keys(this.state.timeSeries).length;
      return (
        <ComposedComponent
          {...this.props}
          data={data}
          isFetchingInitially={isFirstFetch}
          isRefreshing={!isFirstFetch}
        />
      );
    },

    renderNoResults() {
      if (this.props.children) {
        return this.props.children;
      }

      return (
        <div className="graph-panel__graph-empty">
          <h3 className="deluxe">No results</h3>
        </div>
      );
    },

    _noResultsForQuery(data) {
      if (!data.length) {
        return true;
      }

      return data.every((datum) => {
        return datum.response.results.every((result) => {
          return Object.keys(result).length === 0;
        });
      });
    },
  });

  return wrapper;
}
