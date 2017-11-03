import * as React from 'react'
import {replace} from 'react-router-redux'
import {connectedReduxRedirect} from 'redux-auth-wrapper/history4/redirect'

export const UserIsAuthenticated = connectedReduxRedirect({
  authenticatingSelector: ({auth: {isMeLoading}}) => isMeLoading,
  AuthenticatingComponent: () => <div className="page-spinner" />,
  redirectAction: replace,
  wrapperDisplayName: 'UserIsAuthenticated',
  redirectPath: '/',
  authenticatedSelector: ({auth: {me, isMeLoading}}) =>
    !isMeLoading && me !== null,
})

export const UserIsNotAuthenticated = connectedReduxRedirect({
  authenticatingSelector: ({auth: {isMeLoading}}) => isMeLoading,
  AuthenticatingComponent: () => <div className="page-spinner" />,
  redirectAction: replace,
  wrapperDisplayName: 'UserIsNotAuthenticated',
  authenticatedSelector: ({auth: {me, isMeLoading}}) =>
    !isMeLoading && me === null,
  redirectPath: '/',
  allowRedirectBack: false,
})
