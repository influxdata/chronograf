// Libraries
import React, {SFC} from 'react'

// Components
import DatabaseList from 'src/shared/components/DatabaseList'
import MeasurementList from 'src/shared/components/MeasurementList'
import FieldList from 'src/shared/components/FieldList'

// Types
import {QueryConfig, Source} from 'src/types'
import {QueryConfigActions, QueryUpdateState} from 'src/shared/actions/queries'

const actionBinder = (id, isInCEO, action) => (...args) => {
  const stateToUpdate = isInCEO ? QueryUpdateState.CEO : QueryUpdateState.DE
  return action(id, stateToUpdate, ...args)
}

interface Props {
  isInCEO: boolean
  query: QueryConfig
  actions: QueryConfigActions
  source: Source
  initialGroupByTime: string
  isQuerySupportedByExplorer?: boolean
}

const SchemaExplorer: SFC<Props> = ({
  isInCEO,
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
        onChooseNamespace={actionBinder(id, isInCEO, chooseNamespace)}
      />
      <MeasurementList
        query={query}
        querySource={source}
        onChooseTag={actionBinder(id, isInCEO, chooseTag)}
        onGroupByTag={actionBinder(id, isInCEO, groupByTag)}
        onChooseMeasurement={actionBinder(id, isInCEO, chooseMeasurement)}
        onToggleTagAcceptance={actionBinder(id, isInCEO, toggleTagAcceptance)}
        isQuerySupportedByExplorer={isQuerySupportedByExplorer}
      />
      <FieldList
        source={source}
        query={query}
        querySource={source}
        onFill={actionBinder(id, isInCEO, fill)}
        initialGroupByTime={initialGroupByTime}
        onTimeShift={actionBinder(id, isInCEO, timeShift)}
        removeFuncs={actionBinder(id, isInCEO, removeFuncs)}
        onToggleField={actionBinder(id, isInCEO, toggleField)}
        onGroupByTime={actionBinder(id, isInCEO, groupByTime)}
        addInitialField={actionBinder(id, isInCEO, addInitialField)}
        applyFuncsToField={actionBinder(id, isInCEO, applyFuncsToField)}
        isQuerySupportedByExplorer={isQuerySupportedByExplorer}
      />
    </div>
  )
}

export default SchemaExplorer
