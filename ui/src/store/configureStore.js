import {createStore, applyMiddleware, compose} from 'redux';
import {combineReducers} from 'redux';
import thunkMiddleware from 'redux-thunk';
import makeQueryExecuter from 'src/shared/middleware/queryExecuter';
import * as chronografReducers from 'src/chronograf/reducers';
import persistStateEnhancer from './persistStateEnhancer';

const rootReducer = combineReducers(chronografReducers);

export default function configureStore(initialState) {
  const createPersistentStore = compose(
    persistStateEnhancer(),
    applyMiddleware(thunkMiddleware, makeQueryExecuter()),
  )(createStore);


  // https://github.com/elgerlambert/redux-localstorage/issues/42
  // createPersistantStore should ONLY take reducer and initialState
  // any store enhancers must be added to the compose() function.
  return createPersistentStore(
    rootReducer,
    initialState,
  );
}

