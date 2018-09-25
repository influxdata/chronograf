// Libraries
import React, {SFC} from 'react'

// Components
import DatabaseList from 'src/shared/components/DatabaseList'
import MeasurementList from 'src/shared/components/MeasurementList'
import FieldList from 'src/shared/components/FieldList'

// Utiles
import {TimeMachineContainer} from 'src/shared/utils/TimeMachineContainer'

// Types
import {QueryConfig, Source} from 'src/types'

const actionBinder = (id, action) => (...args) => {
  return action(id, ...args)
}

interface Props {
  query: QueryConfig
  source: Source
  initialGroupByTime: string
  isQuerySupportedByExplorer?: boolean
  onFill: TimeMachineContainer['handleFill']
  onTimeShift: TimeMachineContainer['handleTimeShift']
  onChooseTag: TimeMachineContainer['handleChooseTag']
  onGroupByTag: TimeMachineContainer['handleGroupByTag']
  onGroupByTime: TimeMachineContainer['handleGroupByTime']
  onToggleField: TimeMachineContainer['handleToggleField']
  onRemoveFuncs: TimeMachineContainer['handleRemoveFuncs']
  onAddInitialField: TimeMachineContainer['handleAddInitialField']
  onChooseNamespace: TimeMachineContainer['handleChooseNamespace']
  onChooseMeasurement: TimeMachineContainer['handleChooseMeasurement']
  onApplyFuncsToField: TimeMachineContainer['handleApplyFuncsToField']
  onToggleTagAcceptance: TimeMachineContainer['handleToggleTagAcceptance']
}

const SchemaExplorer: SFC<Props> = ({
  query,
  source,
  initialGroupByTime,
  onFill,
  onTimeShift,
  onChooseTag,
  onGroupByTag,
  onGroupByTime,
  onToggleField,
  onRemoveFuncs,
  onAddInitialField,
  onChooseNamespace,
  onChooseMeasurement,
  onApplyFuncsToField,
  onToggleTagAcceptance,
  isQuerySupportedByExplorer = true,
}) => {
  const {id} = query

  return (
    <div className="query-builder">
      <DatabaseList
        query={query}
        querySource={source}
        onChooseNamespace={actionBinder(id, onChooseNamespace)}
      />
      <MeasurementList
        query={query}
        querySource={source}
        onChooseTag={actionBinder(id, onChooseTag)}
        onGroupByTag={actionBinder(id, onGroupByTag)}
        onChooseMeasurement={actionBinder(id, onChooseMeasurement)}
        onToggleTagAcceptance={actionBinder(id, onToggleTagAcceptance)}
        isQuerySupportedByExplorer={isQuerySupportedByExplorer}
      />
      <FieldList
        source={source}
        query={query}
        querySource={source}
        onFill={actionBinder(id, onFill)}
        initialGroupByTime={initialGroupByTime}
        onTimeShift={actionBinder(id, onTimeShift)}
        removeFuncs={actionBinder(id, onRemoveFuncs)}
        onToggleField={actionBinder(id, onToggleField)}
        onGroupByTime={actionBinder(id, onGroupByTime)}
        addInitialField={actionBinder(id, onAddInitialField)}
        applyFuncsToField={actionBinder(id, onApplyFuncsToField)}
        isQuerySupportedByExplorer={isQuerySupportedByExplorer}
      />
    </div>
  )
}

export default SchemaExplorer
