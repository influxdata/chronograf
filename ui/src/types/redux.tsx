import {publishNotification} from '../shared/actions/notifications'
import {Action, Dispatch as ReduxDispatch, Reducer as ReduxReducer} from 'redux'
import {
  RouterState,
  RouterAction,
  LocationChangeAction,
} from 'react-router-redux'

import {CustomLink} from 'src/types'

// Actions
import * as NotificationsActions from 'shared/actions/notifications'

export type ReactRouterAction = RouterAction | LocationChangeAction

export type RootAction = ReactRouterAction | typeof NotificationsActions

// State
export interface RootState {
  router: RouterState
  auth: {logoutLink: string}
  app: {ephemeral: {inPresentationMode: boolean}}
  links: {external: {custom: CustomLink[]}}
}

export type Dispatch = ReduxDispatch<RootAction>
export type Action = Action
// export type Reducer = ReduxReducer<RootState, RootAction>
