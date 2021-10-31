import {createStore, applyMiddleware, compose} from 'redux'
import {combineReducers} from 'redux'
import {routerReducer, routerMiddleware} from 'react-router-redux'
import thunkMiddleware from 'redux-thunk'
import {get} from 'lodash'

import errorsMiddleware from 'shared/middleware/errors'
import {resizeLayout} from 'shared/middleware/resizeLayout'
import {queryStringConfig} from 'shared/middleware/queryStringConfig'
import statusReducers from 'src/status/reducers'
import logsReducer from 'src/logs/reducers'
import sharedReducers from 'shared/reducers'
import dataExplorerReducers from 'src/data_explorer/reducers'
import adminReducers from 'src/admin/reducers'
import kapacitorReducers from 'src/kapacitor/reducers'
import dashboardUI from 'src/dashboards/reducers/ui'
import cellEditorOverlay from 'src/dashboards/reducers/cellEditorOverlay'
import dashTimeV1 from 'src/dashboards/reducers/dashTimeV1'
import persistStateEnhancer from './persistStateEnhancer'
import servicesReducer from 'src/shared/reducers/services'
import envReducer from 'src/shared/reducers/env'

const rootReducer = combineReducers({
  ...statusReducers,
  ...sharedReducers,
  ...dataExplorerReducers,
  ...kapacitorReducers,
  ...adminReducers,
  dashboardUI,
  cellEditorOverlay,
  dashTimeV1,
  envReducer,
  logs: logsReducer,
  routing: routerReducer,
  services: servicesReducer,
})

const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose

const KEY_ORG = 'orgchrono' // local storage key holding active organization
let currentOrg = '' // active organization, possibly empty or undefined

export default function configureStore(initialState, browserHistory) {
  const routingMiddleware = routerMiddleware(browserHistory)
  const createPersistentStore = composeEnhancers(
    persistStateEnhancer(),
    applyMiddleware(
      thunkMiddleware,
      routingMiddleware,
      errorsMiddleware,
      queryStringConfig,
      resizeLayout,
      signalizeChangedOrg
    )
  )(createStore)

  // reload whenever current organization is changed from another tab/window
  try {
    currentOrg = window.localStorage.getItem(KEY_ORG) || ''
    window.addEventListener('storage', function (e) {
      if (e.storageArea !== window.localStorage || e.key !== KEY_ORG) {
        return
      }
      if (e.newValue !== currentOrg) {
        // reload the page on organization change made from another tab
        window.location.reload()
      }
    })
  } catch (e) {
    // ignore window.localStorage unavailability or getItem error
    console.error(e)
  }

  // https://github.com/elgerlambert/redux-localstorage/issues/42
  // createPersistantStore should ONLY take reducer and initialState
  // any store enhancers must be added to the compose() function.
  return createPersistentStore(rootReducer, initialState)
}

/**
 * SignalizeChangedOrg is a redux middleware that
 * stores current organization ID into localStorage so that
 * browser windows/tabs can be notified about session change.
 */
const signalizeChangedOrg = () => next => action => {
  next(action)

  try {
    if (action.type === 'ME_GET_COMPLETED') {
      const orgId = get(
        action,
        ['payload', 'me', 'currentOrganization', 'id'],
        ''
      )
      if (orgId !== currentOrg) {
        currentOrg = orgId
        window.localStorage.setItem(KEY_ORG, currentOrg)
      }
    }
    if (action.type === 'AUTH_EXPIRED') {
      currentOrg = ''
      window.localStorage.setItem(KEY_ORG, currentOrg)
    }
  } catch (e) {
    // ignore window.localStorage unavailability or setItem errors
    console.error(e)
  }
}
