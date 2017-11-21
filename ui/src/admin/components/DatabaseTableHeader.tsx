import * as React from 'react'
import ConfirmButtons from 'shared/components/ConfirmButtons'

import {Database} from 'src/types/influxdbAdmin'
import {func} from 'src/types/funcs'

export interface DatabaseTableHeaderProps {
  database: Database
  isAddRPDisabled: boolean
  onEdit: (database: Database) => (e: {}) => void
  onKeyDown: (database: Database) => (e: {}) => void
  notify: (type: string, message: string) => void
  onDelete: (database: Database) => (e: {}) => void
  onStartDelete: (database: Database) => (e: {}) => void
  onDatabaseDeleteConfirm: (database: Database) => (e: {}) => void
  onAddRetentionPolicy: (database: Database) => (e: {}) => void
  onCancel: func
  onConfirm: func
  onRemoveDeleteCode: func
}

const DatabaseTableHeader: React.SFC<DatabaseTableHeaderProps> = ({
  database,
  onEdit,
  notify,
  onKeyDown,
  onConfirm,
  onCancel,
  onDelete,
  onStartDelete,
  onRemoveDeleteCode,
  onDatabaseDeleteConfirm,
  onAddRetentionPolicy,
  isAddRPDisabled,
}) => {
  if (database.isEditing) {
    return (
      <EditHeader
        database={database}
        onEdit={onEdit}
        onKeyDown={onKeyDown}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    )
  }

  return (
    <Header
      notify={notify}
      database={database}
      onCancel={onRemoveDeleteCode}
      onConfirm={onConfirm}
      onDelete={onDelete}
      onStartDelete={onStartDelete}
      isAddRPDisabled={isAddRPDisabled}
      onAddRetentionPolicy={onAddRetentionPolicy}
      onDatabaseDeleteConfirm={onDatabaseDeleteConfirm}
    />
  )
}

export interface HeaderProps {
  database: Database
  isAddRPDisabled: boolean
  notify: (type: string, message: string) => void
  onConfirm: func
  onCancel: func
  onDelete: (database: Database) => (e: {}) => void
  onStartDelete: (database: Database) => (e: {}) => void
  onAddRetentionPolicy: (database: Database) => (e: {}) => void
  onDatabaseDeleteConfirm: (database: Database) => (e: {}) => void
}

const Header: React.SFC<HeaderProps> = ({
  notify,
  database,
  onCancel,
  onDelete,
  onStartDelete,
  isAddRPDisabled,
  onAddRetentionPolicy,
  onDatabaseDeleteConfirm,
}) => {
  const buttons = (
    <div className="text-right db-manager-header--actions">
      <button
        className="btn btn-xs btn-primary"
        disabled={isAddRPDisabled}
        onClick={onAddRetentionPolicy(database)}
      >
        <span className="icon plus" /> Add Retention Policy
      </button>
      {database.name === '_internal' ? null : (
        <button
          className="btn btn-xs btn-danger"
          onClick={onStartDelete(database)}
        >
          Delete
        </button>
      )}
    </div>
  )

  const onConfirm = db => {
    if (database.deleteCode !== `DELETE ${database.name}`) {
      return notify('error', `Type DELETE ${database.name} to confirm`)
    }

    onDelete(db)
  }

  const deleteConfirmation = (
    <div className="admin-table--delete-db">
      <input
        className="form-control input-xs"
        name="name"
        type="text"
        value={database.deleteCode || ''}
        placeholder={`DELETE ${database.name}`}
        onChange={onDatabaseDeleteConfirm(database)}
        onKeyDown={onDatabaseDeleteConfirm(database)}
        autoFocus={true}
        autoComplete="false"
        spellCheck={false}
      />
      <ConfirmButtons
        item={database}
        onConfirm={onConfirm}
        onCancel={onCancel}
        buttonSize="btn-xs"
      />
    </div>
  )

  return (
    <div className="db-manager-header">
      <h4>{database.name}</h4>
      {database.hasOwnProperty('deleteCode') ? deleteConfirmation : buttons}
    </div>
  )
}

export interface EditHeaderProps {
  database: Database
  onEdit: (database: Database) => (e: {}) => void
  onKeyDown: (database: Database) => (e: {}) => void
  onCancel: (e: {}) => void
  onConfirm: func
}

const EditHeader: React.SFC<EditHeaderProps> = ({
  database,
  onEdit,
  onKeyDown,
  onConfirm,
  onCancel,
}) => (
  <div className="db-manager-header db-manager-header--edit">
    <input
      className="form-control input-sm"
      name="name"
      type="text"
      value={database.name}
      placeholder="Name this Database"
      onChange={onEdit(database)}
      onKeyDown={onKeyDown(database)}
      autoFocus={true}
      spellCheck={false}
      autoComplete="off"
    />
    <ConfirmButtons item={database} onConfirm={onConfirm} onCancel={onCancel} />
  </div>
)

export default DatabaseTableHeader
