import * as React from 'react'
import {connect} from 'react-redux'
import {bindActionCreators} from 'redux'
import * as _ from 'lodash'

import DatabaseManager from 'admin/components/DatabaseManager'

import * as adminActionCreators from 'admin/actions'
import {publishAutoDismissingNotification} from 'shared/dispatchers'

import {SourceNotifyProp} from 'src/types'
import {Database, RetentionPolicy} from 'src/types/influxdbAdmin'

export interface DatabaseManagerPageProps {
  databases: Database[]
  retentionPolicies: RetentionPolicy
  actions: {
    addRetentionPolicy: typeof adminActionCreators.addRetentionPolicy
    loadDBsAndRPsAsync: typeof adminActionCreators.loadDBsAndRPsAsync
    createDatabaseAsync: typeof adminActionCreators.createDatabaseAsync
    deleteDatabaseAsync: typeof adminActionCreators.deleteDatabaseAsync
    createRetentionPolicyAsync: typeof adminActionCreators.createRetentionPolicyAsync
    updateRetentionPolicyAsync: typeof adminActionCreators.updateRetentionPolicyAsync
    addDatabase: typeof adminActionCreators.addDatabase
    removeDatabase: typeof adminActionCreators.removeDatabase
    removeDatabaseDeleteCode: typeof adminActionCreators.removeDatabaseDeleteCode
    removeRetentionPolicy: typeof adminActionCreators.removeRetentionPolicy
    deleteRetentionPolicyAsync: typeof adminActionCreators.deleteRetentionPolicyAsync
    addDatabaseDeleteCode: typeof adminActionCreators.addDatabaseDeleteCode
    editDatabase: typeof adminActionCreators.editDatabase
  }
}

class DatabaseManagerPage extends React.Component<
  DatabaseManagerPageProps & SourceNotifyProp
> {
  private handleDeleteRetentionPolicy = (db, rp) => () => {
    this.props.actions.deleteRetentionPolicyAsync(db, rp)
  }

  private handleStartDeleteDatabase = database => () => {
    this.props.actions.addDatabaseDeleteCode(database)
  }

  private handleEditDatabase = (database: Database) => e => {
    this.props.actions.editDatabase(database, {name: e.target.value})
  }

  private handleCreateDatabase = database => {
    const {actions, notify, source, databases} = this.props
    if (!database.name) {
      return notify('error', 'Database name cannot be blank')
    }

    if (_.findIndex(databases, {name: database.name}, 1) !== -1) {
      return notify('error', 'A database by this name already exists')
    }

    actions.createDatabaseAsync(source.links.databases, database)
  }

  private handleAddRetentionPolicy = database => () => {
    const {addRetentionPolicy} = this.props.actions
    addRetentionPolicy(database)
  }

  private handleKeyDownDatabase = database => e => {
    const {key} = e
    const {actions, notify, source, databases} = this.props

    if (key === 'Escape') {
      actions.removeDatabase(database)
    }

    if (key === 'Enter') {
      if (!database.name) {
        return notify('error', 'Database name cannot be blank')
      }

      if (_.findIndex(databases, {name: database.name}, 1) !== -1) {
        return notify('error', 'A database by this name already exists')
      }

      actions.createDatabaseAsync(source.links.databases, database)
    }
  }

  private handleDatabaseDeleteConfirm = database => e => {
    const {key, target: {value}} = e
    const {actions, notify} = this.props

    if (key === 'Escape') {
      return actions.removeDatabaseDeleteCode(database)
    }

    if (key === 'Enter') {
      if (database.deleteCode !== `DELETE ${database.name}`) {
        return notify('error', `Please type DELETE ${database.name} to confirm`)
      }

      return actions.deleteDatabaseAsync(database)
    }

    actions.editDatabase(database, {deleteCode: value})
  }

  public componentDidMount() {
    const {source: {links: {databases}}, actions} = this.props

    actions.loadDBsAndRPsAsync(databases)
  }

  public render() {
    const {source, databases, actions, notify} = this.props
    return (
      <DatabaseManager
        notify={notify}
        databases={databases}
        isRFDisplayed={!!source.metaUrl}
        addDatabase={actions.addDatabase}
        onEditDatabase={this.handleEditDatabase}
        onCancelDatabase={actions.removeDatabase}
        onConfirmDatabase={this.handleCreateDatabase}
        onDeleteDatabase={actions.deleteDatabaseAsync}
        onKeyDownDatabase={this.handleKeyDownDatabase}
        onAddRetentionPolicy={this.handleAddRetentionPolicy}
        onRemoveDeleteCode={actions.removeDatabaseDeleteCode}
        onStartDeleteDatabase={this.handleStartDeleteDatabase}
        isAddDBDisabled={!!databases.some(db => db.isEditing)}
        onRemoveRetentionPolicy={actions.removeRetentionPolicy}
        onDeleteRetentionPolicy={this.handleDeleteRetentionPolicy}
        onDatabaseDeleteConfirm={this.handleDatabaseDeleteConfirm}
        onCreateRetentionPolicy={actions.createRetentionPolicyAsync}
        onUpdateRetentionPolicy={actions.updateRetentionPolicyAsync}
      />
    )
  }
}

const mapStateToProps = ({admin: {databases, retentionPolicies}}) => ({
  databases,
  retentionPolicies,
})

const mapDispatchToProps = dispatch => ({
  actions: bindActionCreators(adminActionCreators, dispatch),
  notify: bindActionCreators(publishAutoDismissingNotification, dispatch),
})

export default connect(mapStateToProps, mapDispatchToProps)(DatabaseManagerPage)
