import React from 'react'
import {render} from 'react-dom'
import {Provider} from 'react-redux'
import {Route} from 'react-router'
import createHistory from 'history/createBrowserHistory'
import {ConnectedRouter} from 'react-router-redux'

import App from 'src/App'
import AlertsApp from 'src/alerts'
import CheckSources from 'src/CheckSources'
import {HostsPage, HostPage} from 'src/hosts'
import {KubernetesPage} from 'src/kubernetes'
import {Login} from 'src/auth'
import {KapacitorPage, KapacitorRulePage, KapacitorRulesPage, KapacitorTasksPage} from 'src/kapacitor'
import DataExplorer from 'src/data_explorer'
import {DashboardsPage, DashboardPage} from 'src/dashboards'
import {CreateSource, SourcePage, ManageSources} from 'src/sources'
import {AdminPage} from 'src/admin'
import NotFound from 'src/shared/components/NotFound'
import configureStore from 'src/store/configureStore'
import {getMe} from 'shared/apis'
import {receiveMe} from 'shared/actions/me'
import {receiveAuth} from 'shared/actions/auth'
import {disablePresentationMode} from 'shared/actions/app'
import {publishNotification} from 'shared/actions/notifications'
import {loadLocalStorage} from './localStorage'

import 'src/style/chronograf.scss'

import {HTTP_FORBIDDEN, HEARTBEAT_INTERVAL} from 'shared/constants'

const rootNode = document.getElementById('react-root')

let history
const basepath = rootNode.dataset.basepath
window.basepath = basepath
if (basepath) {
  history = createHistory({
    basename: basepath, // this is written in when available by the URL prefixer middleware
  })
} else {
  history = createHistory({
    basename: "",
  })
}

const store = configureStore(loadLocalStorage(), history)

history.listen(() => {
  store.dispatch(disablePresentationMode())
})

window.addEventListener('keyup', (event) => {
  if (event.key === 'Escape') {
    store.dispatch(disablePresentationMode())
  }
})

const Root = React.createClass({
  getInitialState() {
    return {
      loggedIn: null,
    }
  },
  componentDidMount() {
    this.checkAuth()
  },

  activeSource(sources) {
    const defaultSource = sources.find((s) => s.default)
    if (defaultSource && defaultSource.id) {
      return defaultSource
    }
    return sources[0]
  },

  checkAuth() {
    if (store.getState().me.links) {
      return this.setState({loggedIn: true})
    }

    this.heartbeat({shouldDispatchResponse: true})
  },

  async heartbeat({shouldDispatchResponse}) {
    try {
      const {data: me, auth} = await getMe()
      if (shouldDispatchResponse) {
        store.dispatch(receiveMe(me))
        store.dispatch(receiveAuth(auth))
        this.setState({loggedIn: true})
      }

      setTimeout(this.heartbeat.bind(null, {shouldDispatchResponse: false}), HEARTBEAT_INTERVAL)
    } catch (error) {
      if (error.auth) {
        store.dispatch(receiveAuth(error.auth))
      }
      if (error.status === HTTP_FORBIDDEN) {
        store.dispatch(publishNotification('error', 'Session timed out. Please login again.'))
      } else {
        store.dispatch(publishNotification('error', 'Cannot communicate with server.'))
      }

      this.setState({loggedIn: false})
    }
  },

  render() {
    /*if (this.state.loggedIn === null) {
      return <div className="page-spinner"></div>
    }
    if (this.state.loggedIn === false) { // TODO use redux state instead
      return (
        <Provider store={store}>
          <ConnectedRouter history={history}>
            <Route path="/login" component={Login} />
            <Redirect from="*" to="/login" />
          </ConnectedRouter>
        </Provider>
      )
    }*/





    return (
      <Provider store={store}>
        <ConnectedRouter history={history}>
          <Authenticator>
            { sources && sources.length ?
                <Route path="/" component={CreateSource} /> :
                <Route path={`/sources/${this.activeSource(store.getState().sources).id}/hosts`} component={CreateSource} />
            }
            <Route path="/sources/new" component={CreateSource} />
            <Route path="/sources/:sourceID" component={App}>
              <Route component={CheckSources}>
                <Route path="manage-sources" component={ManageSources} />
                <Route path="manage-sources/new" component={SourcePage} />
                <Route path="manage-sources/:id/edit" component={SourcePage} />
                <Route path="chronograf/data-explorer" component={DataExplorer} />
                <Route path="hosts" component={HostsPage} />
                <Route path="hosts/:hostID" component={HostPage} />
                <Route path="kubernetes" component={KubernetesPage} />
                <Route path="kapacitor-config" component={KapacitorPage} />
                <Route path="kapacitor-tasks" component={KapacitorTasksPage} />
                <Route path="alerts" component={AlertsApp} />
                <Route path="dashboards" component={DashboardsPage} />
                <Route path="dashboards/:dashboardID" component={DashboardPage} />
                <Route path="alert-rules" component={KapacitorRulesPage} />
                <Route path="alert-rules/:ruleID" component={KapacitorRulePage} />
                <Route path="alert-rules/new" component={KapacitorRulePage} />
                <Route path="admin" component={AdminPage} />
              </Route>
            </Route>
            <Route path="*" component={NotFound} />
          </Authenticator>
        </ConnectedRouter>
      </Provider>
    )
  },
})

if (rootNode) {
  render(<Root />, rootNode)
}
