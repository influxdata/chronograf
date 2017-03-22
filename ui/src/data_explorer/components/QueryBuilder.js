import React, {PropTypes} from 'react';

import QueryEditor from './QueryEditor';
import QueryTabItem from './QueryTabItem';
import SimpleDropdown from 'src/shared/components/SimpleDropdown';

const {
  arrayOf,
  func,
  node,
  number,
  shape,
  string,
} = PropTypes;

const QueryBuilder = React.createClass({
  propTypes: {
    queries: arrayOf(shape({})).isRequired,
    timeRange: shape({
      upper: string,
      lower: string,
    }).isRequired,
    actions: shape({
      chooseNamespace: func.isRequired,
      chooseMeasurement: func.isRequired,
      chooseTag: func.isRequired,
      groupByTag: func.isRequired,
      addQuery: func.isRequired,
      deleteQuery: func.isRequired,
      toggleField: func.isRequired,
      groupByTime: func.isRequired,
      toggleTagAcceptance: func.isRequired,
      applyFuncsToField: func.isRequired,
    }).isRequired,
    height: string,
    top: string,
    setActiveQueryIndex: func.isRequired,
    handleDeleteQuery: func.isRequired,
    activeQueryIndex: number,
    children: node,
  },

  handleSetActiveQueryIndex(index) {
    this.props.setActiveQueryIndex(index);
  },

  handleAddQuery() {
    this.props.actions.addQuery();
  },

  handleAddRawQuery() {
    this.props.actions.addQuery({rawText: `SELECT "fields" from "db"."rp"."measurement"`});
  },

  getActiveQuery() {
    const {queries, activeQueryIndex} = this.props
    const activeQuery = queries[activeQueryIndex]
    const defaultQuery = queries[0]

    return activeQuery || defaultQuery
  },

  render() {
    const {height, top} = this.props;
    return (
      <div className="query-builder" style={{height, top}}>
        {this.renderQueryTabList()}
        {this.renderQueryEditor()}
      </div>
    );
  },

  renderQueryEditor() {
    const {timeRange, actions} = this.props;
    const query = this.getActiveQuery();

    if (!query) {
      return (
        <div className="qeditor--empty">
          <h5 className="no-user-select">This Graph has no Queries</h5>
          <br/>
          <div className="btn btn-primary" role="button" onClick={this.handleAddQuery}>Add a Query</div>
        </div>
      );
    }

    return (
      <QueryEditor
        timeRange={timeRange}
        query={query}
        actions={actions}
        onAddQuery={this.handleAddQuery}
      />
    );
  },

  renderQueryTabList() {
    const {queries, activeQueryIndex, handleDeleteQuery} = this.props;
    return (
      <div className="query-builder--tabs">
        <div className="query-builder--tabs-heading">
          <h1>Queries</h1>
          {this.renderAddQuery()}
        </div>
        {queries.map((q, i) => {
          let queryTabText;
          if (q.rawText) {
            queryTabText = 'InfluxQL';
          } else {
            queryTabText = (q.measurement && q.fields.length !== 0) ? `${q.measurement}.${q.fields[0].field}` : 'Query';
          }
          return (
            <QueryTabItem
              isActive={i === activeQueryIndex}
              key={i}
              queryIndex={i}
              query={q}
              onSelect={this.handleSetActiveQueryIndex}
              onDelete={handleDeleteQuery}
              queryTabText={queryTabText}
            />
          );
        })}
        {this.props.children}
      </div>
    );
  },

  onChoose(item) {
    switch (item.text) {
      case 'Query Builder':
        this.handleAddQuery();
        break;
      case 'InfluxQL':
        this.handleAddRawQuery();
        break;
    }
  },

  renderAddQuery() {
    return (
      <SimpleDropdown onChoose={this.onChoose} items={[{text: 'Query Builder'}, {text: 'InfluxQL'}]} className="panel--tab-new">
        <span className="icon plus"></span>
      </SimpleDropdown>
    );
  },
});

export default QueryBuilder
