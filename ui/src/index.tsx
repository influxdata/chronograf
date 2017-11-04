import 'babel-polyfill'

import * as React from 'react'
import {render} from 'react-dom'
import {Provider} from 'react-redux'
import {Route} from 'react-router'
import {ConnectedRouter} from 'react-router-redux'
import createHistory from 'history/createBrowserHistory'

import configureStore from './store/configureStore'
import {loadLocalStorage} from './localStorage'

import App from './App'
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
  componentDidCatch(error, info) {
    console.error(error, info)
  }

  componentWillMount() {
    this.flushErrorsQueue()
    this.checkAuth()
  }

  checkAuth = async () => {
    dispatch(authRequested())
    dispatch(meRequested())
    try {
      await this.startHeartbeat({shouldDispatchResponse: true})
    } catch (error) {
      dispatch(errorThrown(error))
    }
  }

  startHeartbeat = async ({shouldDispatchResponse}) => {
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

  flushErrorsQueue = () => {
    if (errorsQueue.length) {
      errorsQueue.forEach(errorText => {
        dispatch(errorThrown({status: 0, auth: null}, errorText, 'warning'))
      })
    }
  }

  render() {
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
            <Route path="/sources/:sourceID" component={UserIsAuthenticated(App)}>
              <Route component={CheckSources} />
              <Route path="status" component={StatusPage} />
              <Route path="hosts" component={HostsPage} />
              <Route path="hosts/:hostID" component={HostPage} />
              <Route path="chronograf/data-explorer" component={DataExplorer} />
              <Route path="dashboards" component={DashboardsPage} />
              <Route path="dashboards/:dashboardID" component={DashboardPage} />
              <Route path="alerts" component={AlertsApp} />
              <Route path="alert-rules" component={KapacitorRulesPage} />
              <Route path="alert-rules/:ruleID" component={KapacitorRulePage} />
              <Route path="alert-rules/new" component={KapacitorRulePage} />
              <Route path="tickscript/new" component={TickscriptPage} />
              <Route path="tickscript/:ruleID" component={TickscriptPage} />
              <Route path="kapacitors/new" component={KapacitorPage} />
              <Route path="kapacitors/:id/edit" component={KapacitorPage} />
              <Route path="kapacitor-tasks" component={KapacitorTasksPage} />
              <Route path="admin" component={AdminPage} />
              <Route path="manage-sources" component={ManageSources} />
              <Route path="manage-sources/new" component={SourcePage} />
              <Route path="manage-sources/:id/edit" component={SourcePage} />
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
