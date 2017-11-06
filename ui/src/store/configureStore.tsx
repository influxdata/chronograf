import {createStore, applyMiddleware, compose, combineReducers} from 'redux'
import {routerReducer, routerMiddleware} from 'react-router-redux'
import thunkMiddleware from 'redux-thunk'

import errorsMiddleware from 'shared/middleware/errors'
import {resizeLayout} from 'shared/middleware/resizeLayout'
import {queryStringConfig} from 'shared/middleware/queryStringConfig'
import statusReducers from 'status/reducers'
import sharedReducers from 'shared/reducers'
import dataExplorerReducers from 'data_explorer/reducers'
import adminReducer from 'admin/reducers/admin'
import kapacitorReducers from 'kapacitor/reducers'
import dashboardUI from 'dashboards/reducers/ui'
import dashTimeV1 from 'dashboards/reducers/dashTimeV1'
import persistStateEnhancer from './persistStateEnhancer'

const rootReducer = combineReducers({
  ...statusReducers,
  ...sharedReducers,
  ...dataExplorerReducers,
  ...kapacitorReducers,
  admin: adminReducer,
  dashboardUI,
  dashTimeV1,
  router: routerReducer,
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
      // queryStringConfig,
      resizeLayout
    )
  )(createStore)

  // https://github.com/elgerlambert/redux-localstorage/issues/42
  // createPersistantStore should ONLY take reducer and initialState
  // any store enhancers must be added to the compose() function.
  return createPersistentStore(rootReducer, initialState)
}
