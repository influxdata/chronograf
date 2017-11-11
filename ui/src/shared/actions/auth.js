import {getMe as getMeAJAX, updateMe as updateMeAJAX} from 'shared/apis/auth'

import {linksReceived} from 'shared/actions/links'

import {publishAutoDismissingNotification} from 'shared/dispatchers'
import {errorThrown} from 'shared/actions/errors'

export const authExpired = auth => ({
  type: 'AUTH_EXPIRED',
  payload: {
    auth,
  },
})

export const authRequested = () => ({
  type: 'AUTH_REQUESTED',
})

export const authReceived = auth => ({
  type: 'AUTH_RECEIVED',
  payload: {
    auth,
  },
})

export const meGetRequested = () => ({
  type: 'ME_GET_REQUESTED',
})

export const meReceivedNotUsingAuth = me => ({
  type: 'ME_RECEIVED__NON_AUTH',
  payload: {
    me,
  },
})

export const meReceivedUsingAuth = me => ({
  type: 'ME_RECEIVED__AUTH',
  payload: {
    me,
  },
})

export const meGetFailed = () => ({
  type: 'ME_GET_FAILED',
})

export const meChangeOrganizationRequested = () => ({
  type: 'ME_CHANGE_ORGANIZATION_REQUESTED',
})

export const meChangeOrganizationCompleted = () => ({
  type: 'ME_CHANGE_ORGANIZATION_COMPLETED',
})

export const meChangeOrganizationFailed = () => ({
  type: 'ME_CHANGE_ORGANIZATION_FAILED',
})

export const logoutLinkReceived = logoutLink => ({
  type: 'LOGOUT_LINK_RECEIVED',
  payload: {
    logoutLink,
  },
})

export const getMeAsync = ({allowReset}) => async dispatch => {
  console.log(allowReset)
  if (allowReset) {
    dispatch(authRequested())
    dispatch(meGetRequested())
  }
  try {
    // These non-me objects are added to every response by some AJAX trickery
    const {
      data: me,
      auth,
      logoutLink,
      external,
      users,
      organizations,
      meLink,
    } = await getMeAJAX()
    console.log('allowReset', allowReset)
    const isUsingAuth = !!logoutLink
    dispatch(isUsingAuth ? meReceivedUsingAuth(me) : meReceivedNotUsingAuth(me))
    dispatch(authReceived(auth))
    dispatch(logoutLinkReceived(logoutLink))
    dispatch(linksReceived({external, users, organizations, me: meLink}))
  } catch (error) {
    dispatch(errorThrown(error))
    dispatch(meGetFailed())
  }
}

export const meChangeOrganizationAsync = (
  url,
  organization
) => async dispatch => {
  dispatch(meChangeOrganizationRequested())
  try {
    const {data} = await updateMeAJAX(url, organization)
    dispatch(
      publishAutoDismissingNotification(
        'success',
        `Now signed into ${data.currentOrganization.name}`
      )
    )
    dispatch(meChangeOrganizationCompleted())
    dispatch(meReceivedUsingAuth(data))
  } catch (error) {
    dispatch(errorThrown(error))
    dispatch(meChangeOrganizationFailed())
  }
}
