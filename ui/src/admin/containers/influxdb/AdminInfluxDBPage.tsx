import React, {PureComponent} from 'react'
import {connect} from 'react-redux'
import {Action, bindActionCreators, Dispatch} from 'redux'
import {
  loadUsersAsync,
  loadRolesAsync,
  loadPermissionsAsync,
  loadDBsAndRPsAsync,
} from 'src/admin/actions/influxdb'

import PageSpinner from 'src/shared/components/PageSpinner'
import QueriesPage from './QueriesPage'
import DatabaseManagerPage from './DatabaseManagerPage'
import {Page} from 'src/reusable_ui'
import SubSections from 'src/shared/components/SubSections'
import {ErrorHandling} from 'src/shared/decorators/errors'

import {notify as notifyAction} from 'src/shared/actions/notifications'
import {Source, RemoteDataState, SourceAuthenticationMethod} from 'src/types'
import {NotificationAction} from 'src/types/notifications'

import UsersPage from './UsersPage'
import RolesPage from './RolesPage'

type LoaderFunc = (url: string) => Promise<void>
interface Props {
  source: Source

  loadUsers: LoaderFunc
  loadRoles: LoaderFunc
  loadPermissions: LoaderFunc
  loadDBsAndRPs: LoaderFunc
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
  constructor(props: Props) {
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

  private get hasRoles(): boolean {
    return !!this.props.source.links.roles
  }

  private get isLDAP(): boolean {
    const {source} = this.props
    return source.authentication === SourceAuthenticationMethod.LDAP
  }

  private get adminSubSections() {
    const {source} = this.props
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
        component: <RolesPage source={source} />,
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

const mapDispatchToProps = (dispatch: Dispatch<Action>) => ({
  loadUsers: bindActionCreators<typeof loadUsersAsync, LoaderFunc>(
    loadUsersAsync,
    dispatch
  ),
  loadRoles: bindActionCreators<typeof loadRolesAsync, LoaderFunc>(
    loadRolesAsync,
    dispatch
  ),
  loadPermissions: bindActionCreators<typeof loadPermissionsAsync, LoaderFunc>(
    loadPermissionsAsync,
    dispatch
  ),
  loadDBsAndRPs: bindActionCreators<typeof loadDBsAndRPsAsync, LoaderFunc>(
    loadDBsAndRPsAsync,
    dispatch
  ),
  notify: bindActionCreators(notifyAction, dispatch),
})

export default connect(null, mapDispatchToProps)(AdminInfluxDBPage)
