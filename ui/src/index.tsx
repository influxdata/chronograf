import 'babel-polyfill'

import React, {PureComponent} from 'react'
import {render} from 'react-dom'
import {Provider as ReduxProvider} from 'react-redux'
import {Router, Route, useRouterHistory} from 'react-router'
import {createHistory, Pathname} from 'history'
import {syncHistoryWithStore} from 'react-router-redux'
import {bindActionCreators} from 'redux'

import configureStore from 'src/store/configureStore'
import {loadLocalStorage} from 'src/localStorage'

import {getRootNode} from 'src/utils/nodes'
import {getBasepath} from 'src/utils/basepath'

import App from 'src/App'
import {
  Login,
  UserIsAuthenticated,
  UserIsNotAuthenticated,
  Purgatory,
} from 'src/auth'
import CheckSources from 'src/CheckSources'
import {StatusPage} from 'src/status'
import {HostsPage, HostPage} from 'src/hosts'
import DataExplorerPage from 'src/data_explorer'
import {DashboardsPage, DashboardPage} from 'src/dashboards'
import {LogsPage} from 'src/logs'
import AlertsApp from 'src/alerts'
import {
  FluxTaskPage,
  FluxTasksPage,
  KapacitorPage,
  KapacitorRulePage,
  KapacitorRulesPage,
  TickscriptPage,
  TickscriptsPage,
} from 'src/kapacitor'
import {ManageSources, OnboardingWizard} from 'src/sources'
import LandingPage from './auth/LandingPage'

import NotFound from 'src/shared/components/NotFound'
import PageSpinner from 'src/shared/components/PageSpinner'

import {getLinksAsync} from 'src/shared/actions/links'
import {getMeAsync} from 'src/shared/actions/auth'
import {disablePresentationMode} from 'src/shared/actions/app'
import {errorThrown} from 'src/shared/actions/errors'
import {notify} from 'src/shared/actions/notifications'
import {
  setHostPageDisplayStatus,
  setV3SupportEnabled,
} from 'src/shared/actions/env'
import {TimeMachineContextProvider} from 'src/shared/utils/TimeMachineContext'

import {getEnv} from 'src/shared/apis/env'

import 'src/style/chronograf.scss'

import {HEARTBEAT_INTERVAL} from 'src/shared/constants'

import * as ErrorsModels from 'src/types/errors'
import {setCustomAutoRefreshOptions} from './shared/components/dropdown_auto_refresh/autoRefreshOptions'
import AdminChronografPage from './admin/containers/chronograf/AdminChronografPage'
import AdminInfluxDBScopedPage from './admin/containers/influxdb/AdminInfluxDBScopedPage'
import DatabaseManagerPage from './admin/containers/influxdb/DatabaseManagerPage'
import UsersPage from './admin/containers/influxdb/UsersPage'
import RolesPage from './admin/containers/influxdb/RolesPage'
import QueriesPage from './admin/containers/influxdb/QueriesPage'
import UserPage from './admin/containers/influxdb/UserPage'
import RolePage from './admin/containers/influxdb/RolePage'

const errorsQueue = []

const rootNode = getRootNode()

const basepath = getBasepath()

declare global {
  interface Window {
    basepath: string
  }
}

// Older method used for pre-IE 11 compatibility
window.basepath = basepath

const browserHistory = useRouterHistory(createHistory)({
  basename: basepath, // this is written in when available by the URL prefixer middleware
})

const store = configureStore(loadLocalStorage(errorsQueue), browserHistory)
const {dispatch} = store

// pathname of last location change
let lastPathname: Pathname

browserHistory.listen(location => {
  // disable presentation mode only if pathname changes, #5382
  if (lastPathname !== location.pathname) {
    dispatch(disablePresentationMode())
    lastPathname = location.pathname
  }
})

window.addEventListener('keyup', event => {
  const escapeKeyCode = 27
  // fallback for browsers that don't support event.key
  if (event.key === 'Escape' || event.keyCode === escapeKeyCode) {
    dispatch(disablePresentationMode())
  }
})

const history = syncHistoryWithStore(browserHistory, store)

const populateEnv = async url => {
  try {
    const envVars = await getEnv(url)
    dispatch(setHostPageDisplayStatus(envVars.hostPageDisabled))
    dispatch(setV3SupportEnabled(envVars.v3SupportEnabled))
    setCustomAutoRefreshOptions(envVars.customAutoRefresh)
  } catch (error) {
    console.error('Error fetching envVars', error)
  }
}

interface State {
  ready: boolean
}

class Root extends PureComponent<Record<string, never>, State> {
  private getLinks = bindActionCreators(getLinksAsync, dispatch)
  private getMe = bindActionCreators(getMeAsync, dispatch)
  private heartbeatTimer: number

  constructor(props) {
    super(props)
    this.state = {
      ready: false,
    }
  }

  public async UNSAFE_componentWillMount() {
    this.flushErrorsQueue()

    try {
      await this.getLinks()
      await this.checkAuth()
      await populateEnv(store.getState().links.environment)
      this.setState({ready: true})
    } catch (error) {
      dispatch(errorThrown(error))
    }
  }

  public componentWillUnmount() {
    clearTimeout(this.heartbeatTimer)
  }

  public render() {
    // renaming this to make it easier to reason about
    const hostPageIsEnabled = !store.getState().env.hostPageDisabled

    return this.state.ready ? (
      <ReduxProvider store={store}>
        <TimeMachineContextProvider>
          <Router history={history}>
            <Route path="/" component={UserIsAuthenticated(CheckSources)} />
            <Route
              path="/landing"
              component={UserIsAuthenticated(LandingPage)}
            />
            <Route path="/login" component={UserIsNotAuthenticated(Login)} />
            <Route
              path="/purgatory"
              component={UserIsAuthenticated(Purgatory)}
            />
            <Route component={UserIsAuthenticated(App)}>
              <Route path="/logs" component={LogsPage} />
            </Route>
            <Route
              path="/sources/new"
              component={UserIsAuthenticated(OnboardingWizard)}
            />
            <Route
              path="/sources/:sourceID"
              component={UserIsAuthenticated(App)}
            >
              <Route component={CheckSources}>
                <Route path="status" component={StatusPage} />
                {hostPageIsEnabled && (
                  <>
                    <Route path="hosts" component={HostsPage} />
                    <Route path="hosts/:hostID" component={HostPage} />
                  </>
                )}
                <Route
                  path="chronograf/data-explorer"
                  component={DataExplorerPage}
                />
                <Route path="dashboards" component={DashboardsPage} />
                <Route
                  path="dashboards/:dashboardID"
                  component={DashboardPage}
                />
                <Route path="alerts" component={AlertsApp} />
                <Route path="alert-rules" component={KapacitorRulesPage} />
                <Route path="flux-tasks" component={FluxTasksPage} />
                <Route path="tickscripts" component={TickscriptsPage} />
                <Route
                  path="kapacitors/:kid/alert-rules/:ruleID" // ruleID can be "new"
                  component={KapacitorRulePage}
                />
                <Route
                  path="alert-rules/:ruleID"
                  component={KapacitorRulePage}
                />
                <Route
                  path="kapacitors/:kid/tickscripts/:ruleID" // ruleID can be "new"
                  component={TickscriptPage}
                />
                <Route
                  path="kapacitors/:kid/fluxtasks/:taskID"
                  component={FluxTaskPage}
                />
                <Route path="kapacitors/new" component={KapacitorPage} />
                <Route path="kapacitors/:id/edit" component={KapacitorPage} />
                <Route
                  path="kapacitors/:id/edit:hash"
                  component={KapacitorPage}
                />
                <Route
                  path="admin-chronograf/:tab"
                  component={AdminChronografPage}
                />
                <Route
                  path="admin-influxdb"
                  component={AdminInfluxDBScopedPage}
                >
                  <Route path="databases" component={DatabaseManagerPage} />
                  <Route path="users" component={UsersPage} />
                  <Route path="roles" component={RolesPage} />
                  <Route path="queries" component={QueriesPage} />
                  <Route path="users/:userName" component={UserPage} />
                  <Route path="roles/:roleName" component={RolePage} />
                </Route>
                <Route path="manage-sources" component={ManageSources} />
              </Route>
            </Route>
            <Route path="*" component={NotFound} />
          </Router>
        </TimeMachineContextProvider>
      </ReduxProvider>
    ) : (
      <PageSpinner />
    )
  }

  private async performHeartbeat({shouldResetMe = false} = {}) {
    await this.getMe({shouldResetMe})

    this.heartbeatTimer = window.setTimeout(() => {
      if (store.getState().auth.me !== null) {
        this.performHeartbeat()
      }
    }, HEARTBEAT_INTERVAL)
  }

  private flushErrorsQueue() {
    if (errorsQueue.length) {
      errorsQueue.forEach(error => {
        if (typeof error === 'object') {
          dispatch(notify(error))
        } else {
          dispatch(
            errorThrown(
              {status: 0, auth: null},
              error,
              ErrorsModels.AlertType.Warning
            )
          )
        }
      })
    }
  }

  private async checkAuth() {
    try {
      await this.performHeartbeat({shouldResetMe: true})
    } catch (error) {
      dispatch(errorThrown(error))
    }
  }
}

if (rootNode) {
  render(<Root />, rootNode)
}
