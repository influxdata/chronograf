import React from 'react'
import PropTypes from 'prop-types'

import Notifications from 'shared/components/Notifications'

import PageSpinner from 'src/shared/components/PageSpinner'
import SplashPage from 'shared/components/SplashPage'

const VERSION = process.env.npm_package_version

const Login = props => {
  const {
    authData: {
      auth: {links, isAuthLoading},
    },
  } = props

  if (isAuthLoading) {
    return <PageSpinner />
  }

  const redirectTo = links && links.length === 1 && links[0].login

  if (redirectTo) {
    window.location.href = redirectTo

    return <PageSpinner />
  }

  return (
    <div>
      <Notifications />
      <SplashPage>
        <h1 className="auth-text-logo">Chronograf</h1>
        <p>
          <strong>{VERSION}</strong> / Time-Series Data Visualization
        </p>
        {links &&
          links.map(({name, login, label}) => (
            <a key={name} className="btn btn-primary" href={login}>
              <span className={`icon ${name}`} />
              Log in with {label}
            </a>
          ))}
      </SplashPage>
    </div>
  )
}

const {array, bool, shape, string} = PropTypes

Login.propTypes = {
  authData: shape({
    me: shape(),
    links: array,
    isLoading: bool,
  }),
  location: shape({
    pathname: string,
  }),
}

export default Login
