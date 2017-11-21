import * as React from 'react'

import DatabaseTable from 'admin/components/DatabaseTable'
import {Database} from 'src/types/influxdbAdmin'
import {func} from 'src/types/funcs'

export interface DatabaseManagerProps {
  databases: Database[]
  isRFDisplayed: boolean
  isAddDBDisabled: boolean
  notify: (type: string, message: string) => void
  addDatabase: func
  onEditDatabase: (database: Database) => (e: {}) => void
  onKeyDownDatabase: (database: Database) => (e: {}) => void
  onDeleteDatabase: (database: Database) => (e: {}) => void
  onStartDeleteDatabase: (database: Database) => (e: {}) => void
  onDatabaseDeleteConfirm: (database: Database) => (e: {}) => void
  onAddRetentionPolicy: (database: Database) => (e: {}) => void
  onCancelDatabase: (database: Database) => (e: {}) => void
  onConfirmDatabase: (database: Database) => void
  onRemoveDeleteCode: func
  onCreateRetentionPolicy: func
  onUpdateRetentionPolicy: func
  onRemoveRetentionPolicy: func
  onDeleteRetentionPolicy: func
}

const DatabaseManager: React.SFC<DatabaseManagerProps> = ({
  databases,
  notify,
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
  onCreateRetentionPolicy,
  onUpdateRetentionPolicy,
  onRemoveRetentionPolicy,
  onDeleteRetentionPolicy,
}) => {
  return (
    <div className="panel panel-default">
      <div className="panel-heading u-flex u-ai-center u-jc-space-between">
        <h2 className="panel-title">
          {databases.length === 1
            ? '1 Database'
            : `${databases.length} Databases`}
        </h2>
        <button
          className="btn btn-sm btn-primary"
          disabled={isAddDBDisabled}
          onClick={addDatabase}
        >
          <span className="icon plus" /> Create Database
        </button>
      </div>
      <div className="panel-body">
        {databases.map(db => (
          <DatabaseTable
            key={db.links.self}
            database={db}
            notify={notify}
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
            onCreateRetentionPolicy={onCreateRetentionPolicy}
            onUpdateRetentionPolicy={onUpdateRetentionPolicy}
            onRemoveRetentionPolicy={onRemoveRetentionPolicy}
            onDeleteRetentionPolicy={onDeleteRetentionPolicy}
          />
        ))}
      </div>
    </div>
  )
}

export default DatabaseManager
