import * as React from 'react'

import DatabaseList from 'shared/components/DatabaseList'
import MeasurementList from 'shared/components/MeasurementList'
import FieldList from 'shared/components/FieldList'
import {QueryConfig, Source} from 'src/types'

import {QueryConfigActions} from 'src/data_explorer/containers/DataExplorer'

const actionBinder = (id, action) => (...args) => action(id, ...args)

export interface SchemaExplorerProps {
  query: QueryConfig
  source: Source
  initialGroupByTime: string
  actions: QueryConfigActions
}

const SchemaExplorer: React.SFC<SchemaExplorerProps> = ({
  query,
  query: {id},
  source,
  initialGroupByTime,
  actions: {
    fill,
    chooseTag,
    groupByTag,
    groupByTime,
    toggleField,
    removeFuncs,
    addInitialField,
    chooseNamespace,
    chooseMeasurement,
    applyFuncsToField,
    toggleTagAcceptance,
  },
}) => (
  <div className="query-builder">
    <DatabaseList
      query={query}
      querySource={source}
      onChooseNamespace={actionBinder(id, chooseNamespace)}
    />
    <MeasurementList
      source={source}
      query={query}
      querySource={source}
      onChooseTag={actionBinder(id, chooseTag)}
      onGroupByTag={actionBinder(id, groupByTag)}
      onChooseMeasurement={actionBinder(id, chooseMeasurement)}
      onToggleTagAcceptance={actionBinder(id, toggleTagAcceptance)}
    />
    <FieldList
      source={source}
      query={query}
      querySource={source}
      initialGroupByTime={initialGroupByTime}
      onToggleField={actionBinder(id, toggleField)}
      onFill={actionBinder(id, fill)}
      onGroupByTime={actionBinder(id, groupByTime)}
      applyFuncsToField={actionBinder(id, applyFuncsToField)}
      removeFuncs={actionBinder(id, removeFuncs)}
      addInitialField={actionBinder(id, addInitialField)}
    />
  </div>
)

export default SchemaExplorer
