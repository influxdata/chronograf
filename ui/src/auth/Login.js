import React from 'react'
import PropTypes from 'prop-types'

import Notifications from 'shared/components/Notifications'

import PageSpinner from 'src/shared/components/PageSpinner'
import SplashPage from 'shared/components/SplashPage'
import {connect} from 'react-redux'

const VERSION = process.env.npm_package_version
const REDIRECT_KEY = 'chronoRedirect'

function storeRedirectPath() {
  try {
    const url = new URL(window.location.href)
    const redirect = url.searchParams.get('redirect')
    window.localStorage.setItem(REDIRECT_KEY, redirect || '')
  } catch (e) {
    // will perform default redirect if localStorage is not available
  }
}

export function useRedirectPath() {
  let retVal
  try {
    retVal = window.localStorage.getItem(REDIRECT_KEY)
    window.localStorage.removeItem(REDIRECT_KEY)
  } catch (e) {
    // localStorage is not available, use default
  }
  // return redirect to localStorage page or root page
  return retVal || '/'
}

const Login = ({auth}) => {
  if (
    Array.isArray(auth.links) &&
    auth.links.length === 1 &&
    auth.links[0].redirectLogin
  ) {
    window.location.href = auth.links[0].login
  }

  if (auth.isAuthLoading) {
    return <PageSpinner />
  }
  storeRedirectPath()

  return (
    <div>
      <Notifications />
      <SplashPage>
        <h1 className="auth-text-logo">Chronograf</h1>
        <p>
          <strong>{VERSION}</strong> / Time-Series Data Visualization
        </p>
        {auth.links &&
          auth.links.map(({name, login, label}) => (
            <a key={name} className="btn btn-primary" href={login}>
              <span className={`icon ${name}`} />
              Log in with {label}
            </a>
          ))}
      </SplashPage>
    </div>
  )
}

const {array, bool, shape} = PropTypes

Login.propTypes = {
  auth: shape({
    me: shape(),
    links: array,
    isLoading: bool,
  }),
}

const mapStateToProps = ({auth}) => ({auth})
export default connect(mapStateToProps, null)(Login)
