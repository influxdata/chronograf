// Libraries
import React, {SFC} from 'react'

// Components
import DatabaseList from 'src/shared/components/DatabaseList'
import MeasurementList from 'src/shared/components/MeasurementList'
import FieldList from 'src/shared/components/FieldList'

// Types
import {QueryConfig, Source} from 'src/types'
import {QueryConfigActions} from 'src/dashboards/actions/cellEditorOverlay'

const actionBinder = (id, action) => (...args) => action(id, ...args)

interface Props {
  query: QueryConfig
  actions: QueryConfigActions
  source: Source
  initialGroupByTime: string
  isQuerySupportedByExplorer?: boolean
}

const SchemaExplorer: SFC<Props> = ({
  query,
  source,
  initialGroupByTime,
  actions: {
    fill,
    timeShift,
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
  isQuerySupportedByExplorer = true,
}) => {
  const {id} = query

  return (
    <div className="query-builder">
      <DatabaseList
        query={query}
        querySource={source}
        onChooseNamespace={actionBinder(id, chooseNamespace)}
      />
      <MeasurementList
        query={query}
        querySource={source}
        onChooseTag={actionBinder(id, chooseTag)}
        onGroupByTag={actionBinder(id, groupByTag)}
        onChooseMeasurement={actionBinder(id, chooseMeasurement)}
        onToggleTagAcceptance={actionBinder(id, toggleTagAcceptance)}
        isQuerySupportedByExplorer={isQuerySupportedByExplorer}
      />
      <FieldList
        source={source}
        query={query}
        querySource={source}
        onFill={actionBinder(id, fill)}
        initialGroupByTime={initialGroupByTime}
        onTimeShift={actionBinder(id, timeShift)}
        removeFuncs={actionBinder(id, removeFuncs)}
        onToggleField={actionBinder(id, toggleField)}
        onGroupByTime={actionBinder(id, groupByTime)}
        addInitialField={actionBinder(id, addInitialField)}
        applyFuncsToField={actionBinder(id, applyFuncsToField)}
        isQuerySupportedByExplorer={isQuerySupportedByExplorer}
      />
    </div>
  )
}

export default SchemaExplorer
