import 'babel-polyfill'

import * as React from 'react'
import {render} from 'react-dom'
import {Provider} from 'react-redux'
import {Route, Switch} from 'react-router'
import {ConnectedRouter} from 'react-router-redux'
import createHistory from 'history/createBrowserHistory'

import configureStore from './store/configureStore'
import {loadLocalStorage} from './localStorage'

import {withApp} from './App'
import {Login, UserIsAuthenticated, UserIsNotAuthenticated} from './auth'
import {checkSources} from './CheckSources'
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
          <Switch>
            <Route
              exact={true}
              path="/"
              component={checkSources(UserIsAuthenticated)}
            />
            <Route
              exact={true}
              path="/login"
              component={UserIsNotAuthenticated(Login)}
            />
            <Route
              exact={true}
              path="/sources/new"
              component={UserIsAuthenticated(SourcePage)}
            />
            <Route
              exact={true}
              path="/sources/:sourceID/status"
              component={withApp(StatusPage)}
            />
            <Route
              exact={true}
              path="/sources/:sourceID/hosts"
              component={withApp(HostsPage)}
            />
            <Route
              exact={true}
              path="/sources/:sourceID/hosts/:hostID"
              component={withApp(HostPage)}
            />
            <Route
              exact={true}
              path="/sources/:sourceID/chronograf/data-explorer"
              component={withApp(DataExplorer)}
            />
            <Route
              exact={true}
              path="/sources/:sourceID/dashboards"
              component={withApp(DashboardsPage)}
            />
            <Route
              exact={true}
              path="/sources/:sourceID/dashboards/:dashboardID"
              component={withApp(DashboardPage)}
            />
            <Route
              exact={true}
              path="/sources/:sourceID/alerts"
              component={withApp(AlertsApp)}
            />
            <Route
              exact={true}
              path="/sources/:sourceID/alert-rules"
              component={withApp(KapacitorRulesPage)}
            />
            <Route
              exact={true}
              path="/sources/:sourceID/alert-rules/:ruleID"
              component={withApp(KapacitorRulePage)}
            />
            <Route
              exact={true}
              path="/sources/:sourceID/alert-rules/new"
              component={withApp(KapacitorRulePage)}
            />
            <Route
              exact={true}
              path="/sources/:sourceID/tickscript/new"
              component={withApp(TickscriptPage)}
            />
            <Route
              exact={true}
              path="/sources/:sourceID/tickscript/:ruleID"
              component={withApp(TickscriptPage)}
            />
            <Route
              exact={true}
              path="/sources/:sourceID/kapacitors/new"
              component={withApp(KapacitorPage)}
            />
            <Route
              exact={true}
              path="/sources/:sourceID/kapacitors/:id/edit"
              component={withApp(KapacitorPage)}
            />
            <Route
              exact={true}
              path="/sources/:sourceID/kapacitor-tasks"
              component={withApp(KapacitorTasksPage)}
            />
            <Route
              exact={true}
              path="/sources/:sourceID/admin"
              component={withApp(AdminPage)}
            />
            <Route
              exact={true}
              path="/sources/:sourceID/manage-sources"
              component={withApp(ManageSources)}
            />
            <Route
              exact={true}
              path="/sources/:sourceID/manage-sources/new"
              component={withApp(SourcePage)}
            />
            <Route
              exact={true}
              path="/sources/:sourceID/manage-sources/:id/edit"
              component={withApp(SourcePage)}
            />
            <Route path="*" component={NotFound} />
          </Switch>
        </ConnectedRouter>
      </Provider>
    )
  }
}

if (rootNode) {
  render(<Root />, rootNode)
}
