import 'babel-polyfill'

import * as React from 'react'
import {render} from 'react-dom'
import {Provider} from 'react-redux'
import {Route} from 'react-router'
import {ConnectedRouter} from 'react-router-redux'
import createHistory from 'history/createBrowserHistory'

import configureStore from './store/configureStore'
import {loadLocalStorage} from './localStorage'

import {withApp} from './App'
import {Login, UserIsAuthenticated, UserIsNotAuthenticated} from './auth'
import CheckSources from './CheckSources'
import {StatusPage} from './status'
import {HostsPage, HostPage} from './hosts'
import DataExplorer from './data_explorer'
import {DashboardsPage, DashboardPage} from './dashboards'
import AlertsApp from './alerts'
import {
  KapacitorPage,
  KapacitorRulePage,
  KapacitorRulesPage,
  KapacitorTasksPage,
  TickscriptPage,
} from './kapacitor'
import {AdminPage} from './admin'
import {SourcePage, ManageSources} from './sources'
import NotFound from 'shared/components/NotFound'

import {getMe} from 'shared/apis'

import {disablePresentationMode} from 'shared/actions/app'
import {
  authRequested,
  authReceived,
  meRequested,
  meReceived,
  logoutLinkReceived,
} from 'shared/actions/auth'
import {linksReceived} from 'shared/actions/links'
import {errorThrown} from 'shared/actions/errors'

import './style/chronograf.scss'

import {HEARTBEAT_INTERVAL} from 'shared/constants'

const errorsQueue = []

const rootNode = document.getElementById('react-root')

// Older method used for pre-IE 11 compatibility
const basepath = rootNode.getAttribute('data-basepath') || ''
window.basepath = basepath

const history = createHistory({
  basename: basepath, // this is written in when available by the URL prefixer middleware
})

const store = configureStore(loadLocalStorage(errorsQueue), history)
const {dispatch} = store

history.listen(() => {
  dispatch(disablePresentationMode())
})

window.addEventListener('keyup', event => {
  const escapeKeyCode = 27
  // fallback for browsers that don't support event.key
  if (event.key === 'Escape' || event.keyCode === escapeKeyCode) {
    dispatch(disablePresentationMode())
  }
})

class Root extends React.Component {
  private checkAuth = async () => {
    dispatch(authRequested())
    dispatch(meRequested())
    try {
      await this.startHeartbeat({shouldDispatchResponse: true})
    } catch (error) {
      dispatch(errorThrown(error))
    }
  }

  private startHeartbeat = async ({shouldDispatchResponse}) => {
    try {
      // These non-me objects are added to every response by some AJAX trickery
      const {data: me, auth, logoutLink, external} = await getMe()
      if (shouldDispatchResponse) {
        dispatch(authReceived(auth))
        dispatch(meReceived(me))
        dispatch(logoutLinkReceived(logoutLink))
        dispatch(linksReceived({external}))
      }

      setTimeout(() => {
        if (store.getState().auth.me !== null) {
          this.startHeartbeat({shouldDispatchResponse: false})
        }
      }, HEARTBEAT_INTERVAL)
    } catch (error) {
      dispatch(errorThrown(error))
    }
  }

  private flushErrorsQueue = () => {
    if (errorsQueue.length) {
      errorsQueue.forEach(errorText => {
        dispatch(errorThrown({status: 0, auth: null}, errorText, 'warning'))
      })
    }
  }

  public componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error(error, info)
  }

  public componentWillMount() {
    this.flushErrorsQueue()
    this.checkAuth()
  }

  public render() {
    return (
      <Provider store={store}>
        <ConnectedRouter history={history}>
          <div>
            <Route path="/" component={UserIsAuthenticated(CheckSources)} />
            <Route path="/login" component={UserIsNotAuthenticated(Login)} />
            <Route
              path="/sources/new"
              component={UserIsAuthenticated(SourcePage)}
            />
            <Route path="/sources/:sourceID">
              <div>
                <Route component={CheckSources} />
                <Route path="status" component={withApp(StatusPage)} />
                <Route path="hosts" component={withApp(HostsPage)} />
                <Route path="hosts/:hostID" component={withApp(HostPage)} />
                <Route
                  path="chronograf/data-explorer"
                  component={withApp(DataExplorer)}
                />
                <Route path="dashboards" component={withApp(DashboardsPage)} />
                <Route
                  path="dashboards/:dashboardID"
                  component={withApp(DashboardPage)}
                />
                <Route path="alerts" component={withApp(AlertsApp)} />
                <Route
                  path="alert-rules"
                  component={withApp(KapacitorRulesPage)}
                />
                <Route
                  path="alert-rules/:ruleID"
                  component={withApp(KapacitorRulePage)}
                />
                <Route
                  path="alert-rules/new"
                  component={withApp(KapacitorRulePage)}
                />
                <Route
                  path="tickscript/new"
                  component={withApp(TickscriptPage)}
                />
                <Route
                  path="tickscript/:ruleID"
                  component={withApp(TickscriptPage)}
                />
                <Route
                  path="kapacitors/new"
                  component={withApp(KapacitorPage)}
                />
                <Route
                  path="kapacitors/:id/edit"
                  component={withApp(KapacitorPage)}
                />
                <Route
                  path="kapacitor-tasks"
                  component={withApp(KapacitorTasksPage)}
                />
                <Route path="admin" component={withApp(AdminPage)} />
                <Route
                  path="manage-sources"
                  component={withApp(ManageSources)}
                />
                <Route
                  path="manage-sources/new"
                  component={withApp(SourcePage)}
                />
                <Route
                  path="manage-sources/:id/edit"
                  component={withApp(SourcePage)}
                />
              </div>
            </Route>
            <Route path="*" component={NotFound} />
          </div>
        </ConnectedRouter>
      </Provider>
    )
  }
}

if (rootNode) {
  render(<Root />, rootNode)
}
