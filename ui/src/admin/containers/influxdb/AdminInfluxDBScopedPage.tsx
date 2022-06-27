import React, {PureComponent, ReactElement} from 'react'
import {connect, ResolveThunks} from 'react-redux'
import {withSource} from 'src/CheckSources'
import {
  loadUsersAsync,
  loadRolesAsync,
  loadPermissionsAsync,
  loadDBsAndRPsAsync,
} from 'src/admin/actions/influxdb'

import PageSpinner from 'src/shared/components/PageSpinner'
import {Page} from 'src/reusable_ui'
import {ErrorHandling} from 'src/shared/decorators/errors'

import {notify as notifyAction} from 'src/shared/actions/notifications'
import {Source, RemoteDataState, SourceAuthenticationMethod} from 'src/types'

const mapDispatchToProps = {
  loadUsers: loadUsersAsync,
  loadRoles: loadRolesAsync,
  loadPermissions: loadPermissionsAsync,
  loadDBsAndRPs: loadDBsAndRPsAsync,
  notify: notifyAction,
}

interface OwnProps {
  source: Source
  children: ReactElement<any>
}

type ReduxDispatchProps = ResolveThunks<typeof mapDispatchToProps>

type Props = OwnProps & ReduxDispatchProps
interface State {
  loading: RemoteDataState
  error?: any
  errorMessage?: string
}

type AdminInfluxDBRefresh = () => void
export const AdminInfluxDBRefreshContext = React.createContext<AdminInfluxDBRefresh>(
  undefined
)

interface WrapToPageProps {
  children: JSX.Element
  hideRefresh?: boolean
}
export const WrapToPage = ({children, hideRefresh}: WrapToPageProps) => (
  <Page className="influxdb-admin">
    <Page.Header fullWidth={true}>
      <Page.Header.Left>
        <Page.Title title="InfluxDB Admin" />
      </Page.Header.Left>
      <Page.Header.Right showSourceIndicator={true}>
        {hideRefresh ? null : (
          <AdminInfluxDBRefreshContext.Consumer>
            {refresh => (
              <span
                className="icon refresh"
                title="Refresh"
                onClick={refresh}
              />
            )}
          </AdminInfluxDBRefreshContext.Consumer>
        )}
      </Page.Header.Right>
    </Page.Header>
    <div style={{height: 'calc(100% - 60px)'}}>{children}</div>
  </Page>
)
@ErrorHandling
export class AdminInfluxDBScopedPage extends PureComponent<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      loading: RemoteDataState.NotStarted,
    }
  }
  public async componentDidMount() {
    await this.refresh()
  }

  private refresh = async () => {
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

    let errorMessage: string
    try {
      errorMessage = 'Failed to load databases.'
      await loadDBsAndRPs(source.links.databases)
      if (source.authentication !== SourceAuthenticationMethod.LDAP) {
        errorMessage = 'Failed to load users.'
        await loadUsers(source.links.users)
        errorMessage = 'Failed to load permissions.'
        await loadPermissions(source.links.permissions)
        if (source.links.roles) {
          errorMessage = 'Failed to load roles.'
          await loadRoles(source.links.roles)
        }
      }
      this.setState({loading: RemoteDataState.Done})
    } catch (e) {
      console.error(e)
      // extract error message for the UI
      let error = e
      if (error.message) {
        error = error.message
      } else if (error.data?.message) {
        error = error.data?.message
      } else if (error.statusText) {
        error = error.statusText
      }
      this.setState({
        loading: RemoteDataState.Error,
        error,
        errorMessage: `Unable to administer InfluxDB. ${errorMessage}`,
      })
    }
  }

  public render() {
    return (
      <AdminInfluxDBRefreshContext.Provider value={this.refresh}>
        {this.content()}
      </AdminInfluxDBRefreshContext.Provider>
    )
  }
  public content() {
    const {source, children} = this.props

    if (!source.version || source.version.startsWith('2')) {
      return (
        <WrapToPage hideRefresh={true}>
          <div className="container-fluid">
            These functions are not available for the currently selected
            InfluxDB {source.version?.startsWith('2') ? 'v2 ' : ''}connection.
            {source.version?.startsWith('2') ? (
              <>
                <br />
                {' Use InfluxDB v2 UI directly at '}
                <a href={source.url}>{source.url}</a>
              </>
            ) : (
              ''
            )}
          </div>
        </WrapToPage>
      )
    }

    const {loading, error, errorMessage} = this.state
    if (
      loading === RemoteDataState.Loading ||
      loading === RemoteDataState.NotStarted
    ) {
      return (
        <WrapToPage hideRefresh={true}>
          <PageSpinner />
        </WrapToPage>
      )
    }

    if (loading === RemoteDataState.Error) {
      return (
        <WrapToPage>
          <div className="container-fluid">
            <div className="panel-body">
              <p className="unexpected-error">{errorMessage}</p>
              <p className="unexpected-error">{(error || '').toString()}</p>
            </div>
          </div>
        </WrapToPage>
      )
    }

    return children
  }
}

export default withSource(
  connect(null, mapDispatchToProps)(AdminInfluxDBScopedPage)
)
