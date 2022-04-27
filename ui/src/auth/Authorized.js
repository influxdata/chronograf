import React, {Component} from 'react'
import PropTypes from 'prop-types'
import {connect} from 'react-redux'
import {withRouter} from 'react-router'

import {isUserAuthorized} from './roles'
export {
  isUserAuthorized,
  MEMBER_ROLE,
  READER_ROLE,
  VIEWER_ROLE,
  EDITOR_ROLE,
  ADMIN_ROLE,
  SUPERADMIN_ROLE,
} from './roles'

class Authorized extends Component {
  UNSAFE_componentWillUpdate() {
    const {router, me} = this.props

    if (me === null) {
      router.push('/login')
    }
  }

  render() {
    const {
      children,
      me,
      isUsingAuth,
      requiredRole,
      replaceWithIfNotAuthorized,
      replaceWithIfNotUsingAuth,
      replaceWithIfAuthorized,
      propsOverride,
    } = this.props

    if (me === null) {
      return null
    }

    // if me response has not been received yet, render nothing
    if (typeof isUsingAuth !== 'boolean') {
      return null
    }

    // React.isValidElement guards against multiple children wrapped by Authorized
    const firstChild = React.isValidElement(children) ? children : children[0]

    if (!isUsingAuth) {
      return replaceWithIfNotUsingAuth || firstChild
    }

    if (isUserAuthorized(me.role, requiredRole)) {
      return replaceWithIfAuthorized || firstChild
    }

    if (propsOverride) {
      return React.cloneElement(firstChild, {...propsOverride})
    }

    return replaceWithIfNotAuthorized || null
  }
}

const {bool, node, shape, string} = PropTypes

Authorized.propTypes = {
  isUsingAuth: bool,
  replaceWithIfNotUsingAuth: node,
  replaceWithIfAuthorized: node,
  replaceWithIfNotAuthorized: node,
  children: node.isRequired,
  router: shape().isRequired,
  me: shape({
    role: string,
  }),
  requiredRole: string.isRequired,
  propsOverride: shape(),
}

const mapStateToProps = ({auth: {me, isUsingAuth}}) => ({
  me,
  isUsingAuth,
})

export default connect(mapStateToProps)(withRouter(Authorized))
