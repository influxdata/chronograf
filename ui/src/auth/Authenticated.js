import {routerActions} from 'react-router-redux'
import PageSpinner from 'src/shared/components/PageSpinner'
import {connectedReduxRedirect} from 'redux-auth-wrapper/history3/redirect'
import locationHelperBuilder from 'redux-auth-wrapper/history3/locationHelper'

const locationHelper = locationHelperBuilder({})

export const UserIsAuthenticated = connectedReduxRedirect({
  redirectPath: '/login',
  AuthenticatingComponent: PageSpinner,
  wrapperDisplayName: 'UserIsAuthenticated',
  redirectAction: routerActions.replace,
  authenticatedSelector: ({auth: {me, isMeLoading}}) =>
    !isMeLoading && me !== null,
  authenticatingSelector: ({auth: {isMeLoading}}) => isMeLoading,
})

export const UserIsNotAuthenticated = connectedReduxRedirect({
  redirectPath: (state, ownProps) =>
    locationHelper.getRedirectQueryParam(ownProps) || '/',
  wrapperDisplayName: 'UserIsNotAuthenticated',
  authenticatedSelector: ({auth: {me, isMeLoading}}) =>
    !isMeLoading && me === null,
  authenticatingSelector: ({auth: {isMeLoading}}) => isMeLoading,
  AuthenticatingComponent: PageSpinner,
  redirectAction: routerActions.replace,
})
