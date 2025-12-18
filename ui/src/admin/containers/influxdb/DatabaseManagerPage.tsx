import React, {ChangeEvent, Component} from 'react'
import {connect} from 'react-redux'
import {withSource} from 'src/CheckSources'
import {Action, bindActionCreators, Dispatch} from 'redux'
import _ from 'lodash'

import DatabaseManager from 'src/admin/components/DatabaseManager'

import * as adminActionCreators from 'src/admin/actions/influxdb'
import {notify as notifyAction} from 'src/shared/actions/notifications'
import {ErrorHandling} from 'src/shared/decorators/errors'

import {
  notifyDatabaseDeleteConfirmationRequired,
  notifyDatabaseNameAlreadyExists,
  notifyDatabaseNameInvalid,
} from 'src/shared/copy/notifications'
import {Source} from 'src/types'
import {Database, RetentionPolicy} from 'src/types/influxAdmin'
import AdminInfluxDBTabbedPage from './AdminInfluxDBTabbedPage'
import {isV3Source} from 'src/shared/constants'

interface Props {
  source: Source
  databases: Database[]
  actions: {
    deleteRetentionPolicyAsync: (
      db: Database,
      rp: RetentionPolicy
    ) => Promise<void>
    addDatabaseDeleteCode: (db: Database) => Promise<void>
    addDatabase: () => void
    editDatabase: (db: Database, updates: Partial<Database>) => void
    removeDatabase: (db: Database) => void
    createDatabaseAsync: (databasesLink: string, db: Database) => Promise<void>
    deleteDatabaseAsync: (db: Database) => Promise<void>
    removeDatabaseDeleteCode: (db: Database) => void
    removeRetentionPolicy: (rp: RetentionPolicy) => void
    addRetentionPolicy: (db: Database) => void
    createRetentionPolicyAsync: (
      db: Database,
      rp: RetentionPolicy
    ) => Promise<void>
    updateRetentionPolicyAsync: (
      db: Database,
      oldRP: RetentionPolicy,
      newRP: RetentionPolicy
    ) => Promise<void>
  }
  notify: typeof notifyAction
}
class DatabaseManagerPage extends Component<Props> {
  constructor(props) {
    super(props)
  }

  handleDeleteRetentionPolicy = (db: Database, rp: RetentionPolicy) => () => {
    this.props.actions.deleteRetentionPolicyAsync(db, rp)
  }

  handleStartDeleteDatabase = (database: Database) => () => {
    this.props.actions.addDatabaseDeleteCode(database)
  }

  handleEditDatabase = (database: Database) => (
    e: ChangeEvent<HTMLInputElement>
  ) => {
    this.props.actions.editDatabase(database, {name: e.target.value})
  }

  handleCreateDatabase = (database: Database) => {
    const {actions, notify, source, databases} = this.props
    if (!database.name) {
      return notify(notifyDatabaseNameInvalid())
    }

    if (_.findIndex(databases, {name: database.name}, 1) !== -1) {
      return notify(notifyDatabaseNameAlreadyExists())
    }

    actions.createDatabaseAsync(source.links.databases, database)
  }

  handleAddRetentionPolicy = (database: Database) => () => {
    const {addRetentionPolicy} = this.props.actions
    addRetentionPolicy(database)
  }

  handleKeyDownDatabase = (database: Database) => (e: KeyboardEvent) => {
    const {key} = e
    const {actions, notify, source, databases} = this.props

    if (key === 'Escape') {
      actions.removeDatabase(database)
      return
    }

    if (key === 'Enter') {
      if (!database.name) {
        return notify(notifyDatabaseNameInvalid())
      }

      if (_.findIndex(databases, {name: database.name}, 1) !== -1) {
        return notify(notifyDatabaseNameAlreadyExists())
      }

      actions.createDatabaseAsync(source.links.databases, database)
    }
  }

  handleDatabaseDeleteConfirm = (database: Database) => (e: {
    key: string
    target: {value: string}
  }) => {
    const {
      key,
      target: {value},
    } = e
    const {actions, notify} = this.props

    if (key === 'Escape') {
      actions.removeDatabaseDeleteCode(database)
      return
    }

    if (key === 'Enter') {
      if (database.deleteCode !== `DELETE ${database.name}`) {
        return notify(notifyDatabaseDeleteConfirmationRequired(database.name))
      }

      return actions.deleteDatabaseAsync(database)
    }

    actions.editDatabase(database, {deleteCode: value})
  }

  render() {
    const {source, databases, actions} = this.props
    const isDBReadOnly = isV3Source(source)
    return (
      <AdminInfluxDBTabbedPage activeTab="databases" source={source}>
        <DatabaseManager
          databases={databases}
          isRFDisplayed={!!source.metaUrl}
          isDBReadOnly={isDBReadOnly}
          isAddDBDisabled={isDBReadOnly || !!databases.some(db => db.isEditing)}
          addDatabase={actions.addDatabase}
          onEditDatabase={this.handleEditDatabase}
          onCancelDatabase={actions.removeDatabase}
          onConfirmDatabase={this.handleCreateDatabase}
          onDeleteDatabase={actions.deleteDatabaseAsync}
          onKeyDownDatabase={this.handleKeyDownDatabase}
          onAddRetentionPolicy={this.handleAddRetentionPolicy}
          onRemoveDeleteCode={actions.removeDatabaseDeleteCode}
          onStartDeleteDatabase={this.handleStartDeleteDatabase}
          onRemoveRetentionPolicy={actions.removeRetentionPolicy}
          onDeleteRetentionPolicy={this.handleDeleteRetentionPolicy}
          onDatabaseDeleteConfirm={this.handleDatabaseDeleteConfirm}
          onCreateRetentionPolicy={actions.createRetentionPolicyAsync}
          onUpdateRetentionPolicy={actions.updateRetentionPolicyAsync}
        />
      </AdminInfluxDBTabbedPage>
    )
  }
}

const mapStateToProps = ({adminInfluxDB: {databases, retentionPolicies}}) => ({
  databases,
  retentionPolicies,
})

const mapDispatchToProps = (dispatch: Dispatch<Action>) => ({
  actions: bindActionCreators(adminActionCreators, dispatch),
  notify: bindActionCreators(notifyAction, dispatch),
})

export default withSource(
  connect(
    mapStateToProps,
    mapDispatchToProps
  )(ErrorHandling(DatabaseManagerPage))
)
