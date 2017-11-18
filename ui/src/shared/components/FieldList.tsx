import * as React from 'react'
import * as _ from 'lodash'

import FieldListItem from 'data_explorer/components/FieldListItem'
import GroupByTimeDropdown from 'data_explorer/components/GroupByTimeDropdown'
import FillQuery from 'shared/components/FillQuery'
import FancyScrollbar from 'shared/components/FancyScrollbar'

import {showFieldKeys} from 'shared/apis/metaQuery'
import showFieldKeysParser from 'shared/parsing/showFieldKeys'
import {
  functionNames,
  numFunctions,
  getFieldsWithName,
  getFuncsByFieldName,
} from 'shared/reducers/helpers/fields'

import {
  QueryConfigField,
  QueryConfig,
  Source,
  QuerySource,
  QueryConfigGroupBy,
} from 'src/types'

export interface FieldListProps {
  source: Source
  query: QueryConfig
  onToggleField: (field: QueryConfigField) => void
  onGroupByTime: (option: string) => void
  onFill?: (fill: string) => void
  applyFuncsToField: (
    field: QueryConfigField,
    groupBy: QueryConfigGroupBy
  ) => void
  isKapacitorRule?: boolean
  querySource: QuerySource
  removeFuncs: (fields: QueryConfigField[]) => void
  addInitialField?: (
    field: QueryConfigField,
    groupBy: QueryConfigGroupBy
  ) => void
  initialGroupByTime: string
}

export interface FieldListState {
  fields: QueryConfigField[]
}

class FieldList extends React.Component<FieldListProps, FieldListState> {
  public static defaultProps = {
    isKapacitorRule: false,
    initialGroupByTime: null,
  }

  public state = {
    fields: [],
  }

  private handleGroupByTime = groupBy => {
    this.props.onGroupByTime(groupBy.menuOption)
  }

  private handleFill = fill => {
    this.props.onFill(fill)
  }

  private handleToggleField = field => {
    const {
      query,
      onToggleField,
      addInitialField,
      initialGroupByTime: time,
      isKapacitorRule,
    } = this.props
    const {fields, groupBy} = query
    const initialGroupBy = {...groupBy, time}

    if (!_.size(fields)) {
      return isKapacitorRule
        ? onToggleField(field)
        : addInitialField(field, initialGroupBy)
    }

    onToggleField(field)
  }

  private handleApplyFuncs = fieldFunc => {
    const {
      query,
      removeFuncs,
      applyFuncsToField,
      initialGroupByTime: time,
    } = this.props
    const {groupBy, fields} = query
    const {funcs} = fieldFunc

    // If one field has no funcs, all fields must have no funcs
    if (!_.size(funcs)) {
      return removeFuncs(fields)
    }

    // If there is no groupBy time, set one
    if (!groupBy.time) {
      return applyFuncsToField(fieldFunc, {...groupBy, time})
    }

    applyFuncsToField(fieldFunc, groupBy)
  }

  private _getFields = () => {
    const {database, measurement, retentionPolicy} = this.props.query
    const {querySource, source} = this.props

    const proxy =
      _.get(querySource, ['links', 'proxy'], null) || source.links.proxy

    showFieldKeys(proxy, database, measurement, retentionPolicy).then(resp => {
      const {errors, fieldSets} = showFieldKeysParser(resp.data)
      if (errors.length) {
        console.error('Error parsing fields keys: ', errors)
      }

      this.setState({
        fields: fieldSets[measurement].map(f => ({value: f, type: 'field'})),
      })
    })
  }

  public componentDidMount() {
    const {database, measurement} = this.props.query
    if (!database || !measurement) {
      return
    }

    this._getFields()
  }

  public componentDidUpdate(prevProps: FieldListProps) {
    const {querySource, query} = this.props
    const {database, measurement, retentionPolicy} = query
    const {
      database: prevDB,
      measurement: prevMeas,
      retentionPolicy: prevRP,
    } = prevProps.query
    if (!database || !measurement) {
      return
    }

    if (
      database === prevDB &&
      measurement === prevMeas &&
      retentionPolicy === prevRP &&
      _.isEqual(prevProps.querySource, querySource)
    ) {
      return
    }

    this._getFields()
  }

  public render() {
    const {
      query: {database, measurement, fields = [], groupBy, fill},
      isKapacitorRule,
    } = this.props

    const hasAggregates = numFunctions(fields) > 0
    const noDBorMeas = !database || !measurement

    return (
      <div className="query-builder--column">
        <div className="query-builder--heading">
          <span>Fields</span>
          {hasAggregates && (
            <div className="query-builder--groupby-fill-container">
              <GroupByTimeDropdown
                selected={groupBy.time}
                onChooseGroupByTime={this.handleGroupByTime}
              />
              {!isKapacitorRule && (
                <FillQuery value={fill} onChooseFill={this.handleFill} />
              )}
            </div>
          )}
        </div>
        {noDBorMeas ? (
          <div className="query-builder--list-empty">
            <span>
              No <strong>Measurement</strong> selected
            </span>
          </div>
        ) : (
          <div className="query-builder--list">
            <FancyScrollbar>
              {this.state.fields.map((fieldFunc, i) => {
                const selectedFields = getFieldsWithName(
                  fieldFunc.value,
                  fields
                )

                const funcs = getFuncsByFieldName(fieldFunc.value, fields)
                const fieldFuncs = selectedFields.length
                  ? selectedFields
                  : [fieldFunc]

                return (
                  <FieldListItem
                    key={i}
                    onToggleField={this.handleToggleField}
                    onApplyFuncsToField={this.handleApplyFuncs}
                    isSelected={!!selectedFields.length}
                    fieldFuncs={fieldFuncs}
                    funcs={functionNames(funcs)}
                    isKapacitorRule={isKapacitorRule}
                  />
                )
              })}
            </FancyScrollbar>
          </div>
        )}
      </div>
    )
  }
}

export default FieldList
