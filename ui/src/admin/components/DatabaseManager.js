import React from 'react'
import PropTypes from 'prop-types'

import {Panel, PanelType} from 'src/reusable_ui'
import DatabaseTable from 'src/admin/components/DatabaseTable'

const DatabaseManager = ({
  databases,
  isRFDisplayed,
  isAddDBDisabled,
  addDatabase,
  onEditDatabase,
  onKeyDownDatabase,
  onCancelDatabase,
  onConfirmDatabase,
  onDeleteDatabase,
  onStartDeleteDatabase,
  onDatabaseDeleteConfirm,
  onRemoveDeleteCode,
  onAddRetentionPolicy,
  onStopEditRetentionPolicy,
  onCancelRetentionPolicy,
  onCreateRetentionPolicy,
  onUpdateRetentionPolicy,
  onRemoveRetentionPolicy,
  onDeleteRetentionPolicy,
}) => {
  return (
    <Panel type={PanelType.Solid}>
      <Panel.Header
        title={
          databases.length === 1
            ? '1 Database'
            : `${databases.length} Databases`
        }
      >
        <button
          className="btn btn-sm btn-primary"
          disabled={isAddDBDisabled}
          onClick={addDatabase}
        >
          <span className="icon plus" /> Create Database
        </button>
      </Panel.Header>
      <Panel.Body>
        {databases.map(db => (
          <DatabaseTable
            key={db.links.self}
            database={db}
            isRFDisplayed={isRFDisplayed}
            onEditDatabase={onEditDatabase}
            onKeyDownDatabase={onKeyDownDatabase}
            onCancelDatabase={onCancelDatabase}
            onConfirmDatabase={onConfirmDatabase}
            onRemoveDeleteCode={onRemoveDeleteCode}
            onDeleteDatabase={onDeleteDatabase}
            onStartDeleteDatabase={onStartDeleteDatabase}
            onDatabaseDeleteConfirm={onDatabaseDeleteConfirm}
            onAddRetentionPolicy={onAddRetentionPolicy}
            onStopEditRetentionPolicy={onStopEditRetentionPolicy}
            onCancelRetentionPolicy={onCancelRetentionPolicy}
            onCreateRetentionPolicy={onCreateRetentionPolicy}
            onUpdateRetentionPolicy={onUpdateRetentionPolicy}
            onRemoveRetentionPolicy={onRemoveRetentionPolicy}
            onDeleteRetentionPolicy={onDeleteRetentionPolicy}
          />
        ))}
      </Panel.Body>
    </Panel>
  )
}

const {arrayOf, bool, func, shape} = PropTypes

DatabaseManager.propTypes = {
  databases: arrayOf(shape()),
  addDatabase: func,
  isRFDisplayed: bool,
  isAddDBDisabled: bool,
  onEditDatabase: func,
  onKeyDownDatabase: func,
  onCancelDatabase: func,
  onConfirmDatabase: func,
  onDeleteDatabase: func,
  onRemoveDeleteCode: func,
  onStartDeleteDatabase: func,
  onDatabaseDeleteConfirm: func,
  onAddRetentionPolicy: func,
  onEditRetentionPolicy: func,
  onStopEditRetentionPolicy: func,
  onCancelRetentionPolicy: func,
  onCreateRetentionPolicy: func,
  onUpdateRetentionPolicy: func,
  onRemoveRetentionPolicy: func,
  onDeleteRetentionPolicy: func,
}

export default DatabaseManager
