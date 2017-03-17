import React, {PropTypes} from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import QueryBuilder from '../components/QueryBuilder';
import Visualization from '../components/Visualization';
import Header from '../containers/Header';
import ResizeContainer, {ResizeBottom} from 'src/shared/components/ResizeContainer'

import {setAutoRefresh} from 'shared/actions/app'
import * as viewActions from 'src/data_explorer/actions/view'

const {
  arrayOf,
  func,
  number,
  shape,
  string,
} = PropTypes;

const DataExplorer = React.createClass({
  propTypes: {
    source: shape({
      links: shape({
        proxy: string.isRequired,
        self: string.isRequired,
      }).isRequired,
    }).isRequired,
    queryConfigs: shape({}),
    queryConfigActions: shape({}).isRequired,
    autoRefresh: number.isRequired,
    handleChooseAutoRefresh: func.isRequired,
    timeRange: shape({
      upper: string,
      lower: string,
    }).isRequired,
    setTimeRange: func.isRequired,
    dataExplorer: shape({
      queryIDs: arrayOf(string).isRequired,
    }).isRequired,
  },

  childContextTypes: {
    source: shape({
      links: shape({
        proxy: string.isRequired,
        self: string.isRequired,
      }).isRequired,
    }).isRequired,
  },

  getChildContext() {
    return {source: this.props.source};
  },

  getInitialState() {
    return {
      activeQueryID: null,
    };
  },

  handleSetActiveQuery(id) {
    this.setState({activeQueryID: id});
  },

  render() {
    const {autoRefresh, handleChooseAutoRefresh, timeRange, setTimeRange, queryConfigs, queryConfigActions, dataExplorer} = this.props
    const {activeQueryID} = this.state
    const queries = dataExplorer.queryIDs.map((qid) => queryConfigs[qid])

    return (
      <div className="data-explorer">
        <Header
          actions={{handleChooseAutoRefresh, setTimeRange}}
          autoRefresh={autoRefresh}
          timeRange={timeRange}
        />
        <ResizeContainer>
          <Visualization
            autoRefresh={autoRefresh}
            timeRange={timeRange}
            queryConfigs={queries}
            activeQueryIndex={0}
          />
          <ResizeBottom>
            <QueryBuilder
              queries={queries}
              actions={queryConfigActions}
              autoRefresh={autoRefresh}
              timeRange={timeRange}
              setActiveQuery={this.handleSetActiveQuery}
              activeQueryID={activeQueryID}
            />
          </ResizeBottom>
        </ResizeContainer>
      </div>
    );
  },
});

function mapStateToProps(state) {
  const {app: {persisted: {autoRefresh}}, timeRange, queryConfigs, dataExplorer} = state;

  return {
    autoRefresh,
    timeRange,
    queryConfigs,
    dataExplorer,
  };
}

function mapDispatchToProps(dispatch) {
  return {
    handleChooseAutoRefresh: bindActionCreators(setAutoRefresh, dispatch),
    setTimeRange: bindActionCreators(viewActions.setTimeRange, dispatch),
    queryConfigActions: bindActionCreators(viewActions, dispatch),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(DataExplorer);
