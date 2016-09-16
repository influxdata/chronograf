import React, {PropTypes} from 'react';
import classNames from 'classnames';
import _ from 'lodash';
import selectStatement from '../utils/influxql/select';

import DatabaseList from './DatabaseList';
import MeasurementList from './MeasurementList';
import FieldList from './FieldList';
import TagList from './TagList';

const DB_TAB = 'databases';
const MEASUREMENTS_TAB = 'measurments';
const FIELDS_TAB = 'fields';
const TAGS_TAB = 'tags';

const {string, shape, func} = PropTypes;
const QueryEditor = React.createClass({
  propTypes: {
    query: shape({
      id: string.isRequired,
    }).isRequired,
    timeRange: shape({
      upper: string,
      lower: string,
    }).isRequired,
    actions: shape({
      chooseNamespace: func.isRequired,
      chooseMeasurement: func.isRequired,
      applyFuncsToField: func.isRequired,
      chooseTag: func.isRequired,
      groupByTag: func.isRequired,
      toggleField: func.isRequired,
      groupByTime: func.isRequired,
      toggleTagAcceptance: func.isRequired,
    }).isRequired,
    onClickStatement: func.isRequired,
  },

  getInitialState() {
    return {
      activeTab: DB_TAB,
      database: null,
      measurement: null,
    };
  },

  componentWillReceiveProps(nextProps) {
    const changingQueries = this.props.query.id !== nextProps.query.id;
    if (changingQueries) {
      this.setState({activeTab: DB_TAB});
    }
  },

  handleChooseNamespace(namespace) {
    this.props.actions.chooseNamespace(this.props.query.id, namespace);

    this.setState({activeTab: MEASUREMENTS_TAB});
  },

  handleChooseMeasurement(measurement) {
    this.props.actions.chooseMeasurement(this.props.query.id, measurement);

    this.setState({activeTab: FIELDS_TAB});
  },

  handleToggleField(field) {
    this.props.actions.toggleField(this.props.query.id, field);
  },

  handleGroupByTime(time) {
    this.props.actions.groupByTime(this.props.query.id, time);
  },

  handleApplyFuncsToField(fieldFunc) {
    this.props.actions.applyFuncsToField(this.props.query.id, fieldFunc);
  },

  handleChooseTag(tag) {
    this.props.actions.chooseTag(this.props.query.id, tag);
  },

  handleToggleTagAcceptance() {
    this.props.actions.toggleTagAcceptance(this.props.query.id);
  },

  handleGroupByTag(tagKey) {
    this.props.actions.groupByTag(this.props.query.id, tagKey);
  },

  handleClickTab(tab) {
    this.setState({activeTab: tab});
  },

  render() {
    const {query, timeRange} = this.props;

    const statement = query.rawText || selectStatement(timeRange, query) || `SELECT "fields" FROM "db"."rp"."measurement"`;

    return (
      <div className="query-editor">
        <div className="query-editor__code">
          {this.renderQueryWarning()}
          <pre className={classNames("", {"rq-mode": query.rawText})} onClick={() => this.props.onClickStatement(query.id)}><code>{statement}</code></pre>
        </div>
        {this.renderEditor()}
      </div>
    );
  },

  renderQueryWarning() {
    if (!this.props.query.rawText) {
      return (
        <div className="query-editor__warning">
          <div className="btn btn-sm btn-warning" onClick={() => this.props.onClickStatement(this.props.query.id)}>Convert to Raw Query</div>
        </div>
      );
    }
  },

  renderEditor() {
    if (this.props.query.rawText) {
      return (
        <div className="generic-empty-state query-editor-empty-state">
          <p className="margin-bottom-zero">
            <span className="icon alert-triangle"></span>
            &nbsp;Only editable in the <strong>Raw Query</strong> tab.
          </p>
        </div>
      );
    }

    const {activeTab} = this.state;
    return (
      <div>
        <div className="query-editor__tabs">
          <div className="query-editor__tabs-heading">Schema Explorer</div>
          <div onClick={_.wrap(DB_TAB, this.handleClickTab)} className={classNames("query-editor__tab", {active: activeTab === DB_TAB})}>Databases</div>
          <div onClick={_.wrap(MEASUREMENTS_TAB, this.handleClickTab)} className={classNames("query-editor__tab", {active: activeTab === MEASUREMENTS_TAB})}>Measurements</div>
          <div onClick={_.wrap(FIELDS_TAB, this.handleClickTab)} className={classNames("query-editor__tab", {active: activeTab === FIELDS_TAB})}>Fields</div>
          <div onClick={_.wrap(TAGS_TAB, this.handleClickTab)} className={classNames("query-editor__tab", {active: activeTab === TAGS_TAB})}>Tags</div>
        </div>
        {this.renderList()}
      </div>
    );
  },

  renderList() {
    const {query} = this.props;

    switch (this.state.activeTab) {
      case DB_TAB:
        return (
          <DatabaseList
            query={query}
            onChooseNamespace={this.handleChooseNamespace}
          />
        );
      case MEASUREMENTS_TAB:
        return (
          <MeasurementList
            query={query}
            onChooseMeasurement={this.handleChooseMeasurement}
          />
        );
      case FIELDS_TAB:
        return (
          <FieldList
            query={query}
            onToggleField={this.handleToggleField}
            onGroupByTime={this.handleGroupByTime}
            applyFuncsToField={this.handleApplyFuncsToField}
          />
        );
      case TAGS_TAB:
        return (
          <TagList
            query={query}
            onChooseTag={this.handleChooseTag}
            onGroupByTag={this.handleGroupByTag}
            onToggleTagAcceptance={this.handleToggleTagAcceptance}
          />
        );
      default:
        return <ul className="query-editor__list"></ul>;
    }
  },
});

export default QueryEditor;
