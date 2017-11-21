import * as React from 'react'
import * as _ from 'lodash'
import * as classnames from 'classnames'

import DatabaseRow from 'admin/components/DatabaseRow'
import DatabaseTableHeader from 'admin/components/DatabaseTableHeader'
import {DATABASE_TABLE} from 'admin/constants/tableSizing'

import {Database} from 'src/types/influxdbAdmin'
import {func} from 'src/types/funcs'

export interface DatabaseTableProps {
  database: Database
  isRFDisplayed: boolean
  notify: (type: string, message: string) => void
  onEditDatabase: (database: Database) => (e: {}) => void
  onKeyDownDatabase: (database: Database) => (e: {}) => void
  onDeleteDatabase: (database: Database) => (e: {}) => void
  onStartDeleteDatabase: (database: Database) => (e: {}) => void
  onDatabaseDeleteConfirm: (database: Database) => (e: {}) => void
  onAddRetentionPolicy: (database: Database) => (e: {}) => void
  onCancelDatabase: func
  onConfirmDatabase: func
  onRemoveDeleteCode: func
  onCreateRetentionPolicy: func
  onUpdateRetentionPolicy: func
  onRemoveRetentionPolicy: func
  onDeleteRetentionPolicy: func
}

const DatabaseTable: React.SFC<DatabaseTableProps> = ({
  database,
  notify,
  isRFDisplayed,
  onEditDatabase,
  onKeyDownDatabase,
  onCancelDatabase,
  onConfirmDatabase,
  onDeleteDatabase,
  onRemoveDeleteCode,
  onStartDeleteDatabase,
  onDatabaseDeleteConfirm,
  onAddRetentionPolicy,
  onCreateRetentionPolicy,
  onUpdateRetentionPolicy,
  onRemoveRetentionPolicy,
  onDeleteRetentionPolicy,
}) => {
  return (
    <div
      className={classnames('db-manager', {
        'db-manager--edit': database.isEditing,
      })}
    >
      <DatabaseTableHeader
        database={database}
        notify={notify}
        onEdit={onEditDatabase}
        onCancel={onCancelDatabase}
        onDelete={onDeleteDatabase}
        onConfirm={onConfirmDatabase}
        onKeyDown={onKeyDownDatabase}
        onStartDelete={onStartDeleteDatabase}
        onRemoveDeleteCode={onRemoveDeleteCode}
        onAddRetentionPolicy={onAddRetentionPolicy}
        onDatabaseDeleteConfirm={onDatabaseDeleteConfirm}
        isAddRPDisabled={!!database.retentionPolicies.some(rp => rp.isNew)}
      />
      <div className="db-manager-table">
        <table className="table v-center table-highlight">
          <thead>
            <tr>
              <th style={{width: `${DATABASE_TABLE.colRetentionPolicy}px`}}>
                Retention Policy
              </th>
              <th style={{width: `${DATABASE_TABLE.colDuration}px`}}>
                Duration
              </th>
              {isRFDisplayed ? (
                <th style={{width: `${DATABASE_TABLE.colReplication}px`}}>
                  Replication Factor
                </th>
              ) : null}
              <th style={{width: `${DATABASE_TABLE.colDelete}px`}} />
            </tr>
          </thead>
          <tbody>
            {_.sortBy(database.retentionPolicies, ({name}) =>
              name.toLowerCase()
            ).map(rp => {
              return (
                <DatabaseRow
                  key={rp.links.self}
                  notify={notify}
                  database={database}
                  retentionPolicy={rp}
                  onCreate={onCreateRetentionPolicy}
                  onUpdate={onUpdateRetentionPolicy}
                  onRemove={onRemoveRetentionPolicy}
                  onDelete={onDeleteRetentionPolicy}
                  isRFDisplayed={isRFDisplayed}
                  isDeletable={database.retentionPolicies.length > 1}
                />
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default DatabaseTable
