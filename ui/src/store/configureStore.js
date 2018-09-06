import {createStore, applyMiddleware, compose} from 'redux'
import {combineReducers} from 'redux'
import {routerReducer, routerMiddleware} from 'react-router-redux'
import thunkMiddleware from 'redux-thunk'

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

const rootReducer = combineReducers({
  ...statusReducers,
  ...sharedReducers,
  ...dataExplorerReducers,
  ...kapacitorReducers,
  ...adminReducers,
  dashboardUI,
  cellEditorOverlay,
  dashTimeV1,
  logs: logsReducer,
  routing: routerReducer,
  services: servicesReducer,
})

const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose

export default function configureStore(initialState, browserHistory) {
  const routingMiddleware = routerMiddleware(browserHistory)
  const createPersistentStore = composeEnhancers(
    persistStateEnhancer(),
    applyMiddleware(
      thunkMiddleware,
      routingMiddleware,
      errorsMiddleware,
      queryStringConfig,
      resizeLayout
    )
  )(createStore)

  // https://github.com/elgerlambert/redux-localstorage/issues/42
  // createPersistantStore should ONLY take reducer and initialState
  // any store enhancers must be added to the compose() function.
  return createPersistentStore(rootReducer, initialState)
}
