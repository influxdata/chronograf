import React from 'react'
import PropTypes from 'prop-types'

import DatabaseTable from 'src/admin/components/DatabaseTable'
import FancyScrollbar from 'src/shared/components/FancyScrollbar'

const DatabaseManager = ({
  databases,
  isRFDisplayed,
  isDBReadOnly,
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
    <div className="panel panel-solid influxdb-admin">
      <div className="panel-heading">
        <h2 className="panel-title">
          {databases.length === 1
            ? '1 Database'
            : `${databases.length} Databases`}
        </h2>
        <div className="panel-heading--right">
          <button
            className="btn btn-sm btn-primary"
            disabled={isAddDBDisabled}
            onClick={addDatabase}
            data-test="create-db--button"
          >
            <span className="icon plus" /> Create Database
          </button>
        </div>
      </div>
      <div className="panel-body" style={{paddingRight: 20}}>
        <FancyScrollbar>
          <div style={{paddingRight: 10}}>
            {databases.map(db => (
              <DatabaseTable
                key={db.links.self}
                database={db}
                isRFDisplayed={isRFDisplayed}
                isDBReadOnly={isDBReadOnly}
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
          </div>
        </FancyScrollbar>
      </div>
    </div>
  )
}

const {arrayOf, bool, func, shape} = PropTypes

DatabaseManager.propTypes = {
  databases: arrayOf(shape()),
  addDatabase: func,
  isRFDisplayed: bool,
  isDBReadOnly: bool,
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
