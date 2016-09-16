import React, {PropTypes} from 'react';

import FieldListItem from './FieldListItem';
import GroupByTimeDropdown from './GroupByTimeDropdown';

import {showFieldKeys} from 'shared/apis/metaQuery';
import showFieldKeysParser from 'shared/parsing/showFieldKeys';

const {string, shape, func} = PropTypes;
const FieldList = React.createClass({
  propTypes: {
    query: shape({
      database: string,
      measurement: string,
    }).isRequired,
    onToggleField: func.isRequired,
    onGroupByTime: func.isRequired,
    applyFuncsToField: func.isRequired,
  },

  contextTypes: {
    dataNodes: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
    clusterID: PropTypes.string,
  },

  getInitialState() {
    return {
      fields: [],
    };
  },

  componentDidMount() {
    const {database, measurement} = this.props.query;
    if (!database || !measurement) {
      return;
    }

    const {dataNodes, clusterID} = this.context;
    showFieldKeys(dataNodes, database, measurement, clusterID).then((resp) => {
      const {errors, fieldSets} = showFieldKeysParser(resp.data);
      if (errors.length) {
        // TODO: do something
      }

      this.setState({
        fields: fieldSets[measurement].map((f) => {
          return {field: f, funcs: []};
        }),
      });
    });
  },

  handleGroupByTime(groupBy) {
    this.props.onGroupByTime(groupBy.menuOption);
  },

  render() {
    const {query} = this.props;
    const hasAggregates = query.fields.some((f) => f.funcs && f.funcs.length);
    const hasGroupByTime = query.groupBy.time;

    return (
      <div>
        {
          hasAggregates ?
            <div className="query-editor__list-header group-by-time">
              <div className="group-by-time-dropdown-label">Group by time</div>
              <GroupByTimeDropdown isOpen={!hasGroupByTime} selected={query.groupBy.time} onChooseGroupByTime={this.handleGroupByTime} />
            </div>
            : null
        }
        {this.renderList()}
      </div>
    );
  },

  renderList() {
    const {database, measurement} = this.props.query;
    if (!database || !measurement) {
      return <div className="query-editor__empty">No measurement selected.</div>;
    }

    return (<ul className="query-editor__list">
      {this.state.fields.map((fieldFunc) => {
        const selectedField = this.props.query.fields.find((f) => f.field === fieldFunc.field);
        return (
          <FieldListItem
            key={fieldFunc.field}
            onToggleField={this.props.onToggleField}
            onApplyFuncsToField={this.props.applyFuncsToField}
            isSelected={!!selectedField}
            fieldFunc={selectedField || fieldFunc}
          />
        );
      })}
    </ul>
    );
  },
});

export default FieldList;
