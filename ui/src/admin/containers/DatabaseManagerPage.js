import React, {PropTypes, Component} from 'react'
import {connect} from 'react-redux'
import {bindActionCreators} from 'redux'

import DatabaseManager from 'src/admin/components/DatabaseManager'

import * as adminActionCreators from 'src/admin/actions'
import {publishAutoDismissingNotification} from 'shared/dispatchers'

class DatabaseManagerPage extends Component {
  constructor(props) {
    super(props)
    this.handleKeyDownDatabase = ::this.handleKeyDownDatabase
    this.handleDatabaseDeleteConfirm = ::this.handleDatabaseDeleteConfirm
    this.handleCreateDatabase = ::this.handleCreateDatabase
  }

  componentDidMount() {
    const {source: {links: {databases}}, actions} = this.props

    actions.loadDBsAndRPsAsync(databases)
  }

  render() {
    const {source, databases, actions, notify} = this.props
    return (

      <DatabaseManager
        databases={databases}
        notify={notify}
        isRFDisplayed={!!source.metaUrl}
        isAddDBDisabled={!!databases.some(db => db.isEditing)}
        onKeyDownDatabase={this.handleKeyDownDatabase}
        onDatabaseDeleteConfirm={this.handleDatabaseDeleteConfirm}
        addDatabase={actions.addDatabase}
        onEditDatabase={actions.editDatabase}
        onCancelDatabase={actions.removeDatabase}
        onConfirmDatabase={this.handleCreateDatabase}
        onDeleteDatabase={actions.deleteDatabaseAsync}
        onStartDeleteDatabase={actions.addDatabaseDeleteCode}
        onRemoveDeleteCode={actions.removeDatabaseDeleteCode}
        onAddRetentionPolicy={actions.addRetentionPolicy}
        onCreateRetentionPolicy={actions.createRetentionPolicyAsync}
        onUpdateRetentionPolicy={actions.updateRetentionPolicyAsync}
        onRemoveRetentionPolicy={actions.removeRetentionPolicy}
        onDeleteRetentionPolicy={actions.deleteRetentionPolicyAsync}
      />
    )
  }

  handleCreateDatabase(database) {
    const {actions, notify, source} = this.props

    if (!database.name) {
      return notify('error', 'Database name cannot be blank')
    }

    actions.createDatabaseAsync(source.links.databases, database)
  }

  handleKeyDownDatabase(e, database) {
    const {key} = e
    const {actions, notify, source} = this.props

    if (key === 'Escape') {
      actions.removeDatabase(database)
    }

    if (key === 'Enter') {
      if (!database.name) {
        return notify('error', 'Database name cannot be blank')
      }

      actions.createDatabaseAsync(source.links.databases, database)
    }
  }

  handleDatabaseDeleteConfirm(database, e) {
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
}

const {
  arrayOf,
  bool,
  func,
  number,
  shape,
  string,
} = PropTypes

DatabaseManagerPage.propTypes = {
  source: shape({
    links: shape({
      proxy: string,
    }),
  }),
  databases: arrayOf(shape({
    name: string,
    isEditing: bool,
  })),
  retentionPolicies: arrayOf(arrayOf(shape({
    name: string,
    duration: string,
    replication: number,
    isDefault: bool,
  }))),
  actions: shape({
    addRetentionPolicy: func,
    loadDBsAndRPsAsync: func,
    createDatabaseAsync: func,
    createRetentionPolicyAsync: func,
    addDatabase: func,
    removeDatabase: func,
    startDeleteDatabase: func,
    removeDatabaseDeleteCode: func,
    removeRetentionPolicy: func,
    deleteRetentionPolicyAsync: func,
  }),
  notify: func,
}

const mapStateToProps = ({admin: {databases, retentionPolicies}}) => ({
  databases,
  retentionPolicies,
})

const mapDispatchToProps = (dispatch) => ({
  actions: bindActionCreators(adminActionCreators, dispatch),
  notify: bindActionCreators(publishAutoDismissingNotification, dispatch),
})

export default connect(mapStateToProps, mapDispatchToProps)(DatabaseManagerPage)
