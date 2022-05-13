import React, {PureComponent} from 'react'
import {connect} from 'react-redux'
import {Action, bindActionCreators, Dispatch} from 'redux'
import {
  addRole,
  editRole,
  deleteRole,
  loadUsersAsync,
  loadRolesAsync,
  createRoleAsync,
  deleteRoleAsync,
  loadPermissionsAsync,
  updateRoleUsersAsync,
  updateRolePermissionsAsync,
  filterRoles as filterRolesAction,
  loadDBsAndRPsAsync,
} from 'src/admin/actions/influxdb'

import PageSpinner from 'src/shared/components/PageSpinner'
import RolesTable from 'src/admin/components/RolesTable'
import QueriesPage from './QueriesPage'
import DatabaseManagerPage from './DatabaseManagerPage'
import {Page} from 'src/reusable_ui'
import SubSections from 'src/shared/components/SubSections'
import {ErrorHandling} from 'src/shared/decorators/errors'

import {notify as notifyAction} from 'src/shared/actions/notifications'
import {
  Source,
  User as InfluxDBUser,
  Role as InfluxDBRole,
  Permission,
  RemoteDataState,
  SourceAuthenticationMethod,
} from 'src/types'
import {InfluxDBPermissions} from 'src/types/auth'
import {NotificationAction} from 'src/types/notifications'

import {notifyRoleNameInvalid} from 'src/shared/copy/notifications'
import UsersPage from './UsersPage'

const isValidRole = role => {
  const minLen = 3
  return role.name.length >= minLen
}

interface User extends InfluxDBUser {
  isEditing: boolean
}

interface Role extends InfluxDBRole {
  isEditing: boolean
}

interface Props {
  source: Source
  users: User[]
  roles: Role[]
  permissions: Permission[]
  loadUsers: (url: string) => Promise<void>
  loadRoles: (url: string) => Promise<void>
  loadPermissions: (url: string) => Promise<void>
  loadDBsAndRPs: (url: string) => Promise<void>
  addRole: () => void
  removeRole: (role: Role) => void
  editRole: (role: Role, updates: Partial<Role>) => void
  createRole: (url: string, role: Role) => void
  deleteRole: (role: Role) => void
  filterRoles: () => void
  updateRoleUsers: (role: Role, users: User[]) => void
  updateRolePermissions: (role: Role, permissions: Permission[]) => void
  notify: NotificationAction
  params: {
    tab: string
  }
}

interface State {
  loading: RemoteDataState
  error?: any
  errorMessage?: string
}

@ErrorHandling
export class AdminInfluxDBPage extends PureComponent<Props, State> {
  constructor(props) {
    super(props)
    this.state = {
      loading: RemoteDataState.NotStarted,
    }
  }
  public async componentDidMount() {
    const {
      source,
      loadUsers,
      loadRoles,
      loadPermissions,
      loadDBsAndRPs,
    } = this.props
    if (!source.version || source.version.startsWith('2')) {
      // administration is not possible for v2 type
      return
    }

    this.setState({loading: RemoteDataState.Loading})

    if (source.authentication === SourceAuthenticationMethod.LDAP) {
      return this.setState({loading: RemoteDataState.Done})
    }

    let errorMessage: string
    try {
      errorMessage = 'Failed to load users.'
      await loadUsers(source.links.users)
      errorMessage = 'Failed to load permissions.'
      await loadPermissions(source.links.permissions)
      errorMessage = 'Failed to load databases.'
      await loadDBsAndRPs(source.links.databases)
      if (source.links.roles) {
        errorMessage = 'Failed to load roles.'
        await loadRoles(source.links.roles)
      }
      this.setState({loading: RemoteDataState.Done})
    } catch (error) {
      console.error(error)
      this.setState({
        loading: RemoteDataState.Error,
        error,
        errorMessage: `Unable to administer InfluxDB. ${errorMessage}`,
      })
    }
  }

  public render() {
    return (
      <Page>
        <Page.Header>
          <Page.Header.Left>
            <Page.Title title="InfluxDB Admin" />
          </Page.Header.Left>
          <Page.Header.Right showSourceIndicator={true} />
        </Page.Header>
        <Page.Contents fullWidth={true}>{this.admin}</Page.Contents>
      </Page>
    )
  }

  private get admin(): JSX.Element {
    const {source, params} = this.props
    const {loading, error, errorMessage} = this.state
    if (loading === RemoteDataState.Loading) {
      return <PageSpinner />
    }

    if (loading === RemoteDataState.Error) {
      return (
        <div className="container-fluid">
          <div className="panel-body">
            <p className="unexpected-error">{errorMessage}</p>
            <p className="unexpected-error">{(error || '').toString()}</p>
          </div>
        </div>
      )
    }

    if (!source.version || source.version.startsWith('2')) {
      return (
        <div className="container-fluid">
          These functions are not available for the currently selected InfluxDB
          Connection.
        </div>
      )
    }
    return (
      <div className="container-fluid">
        <SubSections
          parentUrl="admin-influxdb"
          sourceID={source.id}
          activeSection={params.tab}
          sections={this.adminSubSections}
        />
      </div>
    )
  }

  private handleClickCreate = () => () => {
    this.props.addRole()
  }

  private handleEditRole = (role, updates) => {
    this.props.editRole(role, updates)
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  private handleSaveRole = async role => {
    const {notify} = this.props
    if (!isValidRole(role)) {
      notify(notifyRoleNameInvalid())
      return
    }
    if (role.isNew) {
      this.props.createRole(this.props.source.links.roles, role)
    } else {
      // TODO update role
    }
  }

  private handleCancelEditRole = role => {
    this.props.removeRole(role)
  }

  private handleDeleteRole = role => {
    this.props.deleteRole(role)
  }

  private handleUpdateRoleUsers = (role, users) => {
    this.props.updateRoleUsers(role, users)
  }

  private handleUpdateRolePermissions = (role, permissions) => {
    this.props.updateRolePermissions(role, permissions)
  }

  private get allowed(): InfluxDBPermissions[] {
    const {permissions} = this.props
    const globalPermissions = permissions.find(p => p.scope === 'all')
    return globalPermissions ? globalPermissions.allowed : []
  }

  private get hasRoles(): boolean {
    return !!this.props.source.links.roles
  }

  private get isLDAP(): boolean {
    const {source} = this.props
    return source.authentication === SourceAuthenticationMethod.LDAP
  }

  private get adminSubSections() {
    const {users, roles, source, filterRoles} = this.props
    return [
      {
        url: 'databases',
        name: 'Databases',
        enabled: true,
        component: <DatabaseManagerPage source={source} />,
      },
      {
        url: 'users',
        name: 'Users',
        enabled: !this.isLDAP,
        component: <UsersPage source={source} />,
      },
      {
        url: 'roles',
        name: 'Roles',
        enabled: this.hasRoles && !this.isLDAP,
        component: (
          <RolesTable
            roles={roles}
            allUsers={users}
            permissions={this.allowed}
            isEditing={roles.some(r => r.isEditing)}
            onClickCreate={this.handleClickCreate}
            onEdit={this.handleEditRole}
            onSave={this.handleSaveRole}
            onCancel={this.handleCancelEditRole}
            onDelete={this.handleDeleteRole}
            onFilter={filterRoles}
            onUpdateRoleUsers={this.handleUpdateRoleUsers}
            onUpdateRolePermissions={this.handleUpdateRolePermissions}
          />
        ),
      },
      {
        url: 'queries',
        name: 'Queries',
        enabled: true,
        component: <QueriesPage source={source} />,
      },
    ]
  }
}

const mapStateToProps = ({adminInfluxDB: {users, roles, permissions}}) => ({
  users,
  roles,
  permissions,
})

const mapDispatchToProps = (dispatch: Dispatch<Action>) => ({
  loadUsers: bindActionCreators(loadUsersAsync, dispatch),
  loadRoles: bindActionCreators(loadRolesAsync, dispatch),
  loadPermissions: bindActionCreators(loadPermissionsAsync, dispatch),
  loadDBsAndRPs: bindActionCreators(loadDBsAndRPsAsync, dispatch),
  addRole: bindActionCreators(addRole, dispatch),
  removeRole: bindActionCreators(deleteRole, dispatch),
  editRole: bindActionCreators(editRole, dispatch),
  createRole: bindActionCreators(createRoleAsync, dispatch),
  deleteRole: bindActionCreators(deleteRoleAsync, dispatch),
  filterRoles: bindActionCreators(filterRolesAction, dispatch),
  updateRoleUsers: bindActionCreators(updateRoleUsersAsync, dispatch),
  updateRolePermissions: bindActionCreators(
    updateRolePermissionsAsync,
    dispatch
  ),
  notify: bindActionCreators(notifyAction, dispatch),
})

export default connect(mapStateToProps, mapDispatchToProps)(AdminInfluxDBPage)
