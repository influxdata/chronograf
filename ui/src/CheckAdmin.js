import React, {PropTypes} from 'react'
import {withRouter} from 'react-router'
import {connect} from 'react-redux'

const {bool, func, node, shape, string} = PropTypes

const CheckAdmin = React.createClass({
  propTypes: {
    children: node,
    router: shape({
      push: func.isRequired,
    }).isRequired,
    auth: shape({
      isUsingAuth: bool,
      me: shape(),
    }),
    links: shape({
      users: string,
      organizations: string,
    }),
  },

  async componentWillUpdate(nextProps) {
    const {router, auth: {isUsingAuth, me}, links} = nextProps

    if (
      isUsingAuth === undefined ||
      (me && me.role === undefined) || // TODO: not sure this happens
      !links.users ||
      !links.organizations
    ) {
      return
    }
    if (!isUsingAuth) {
      // if your role is not authorized for this route, go home
      return router.push('')
    }
  },

  render() {
    const {auth: {isUsingAuth, me}, links} = this.props

    if (
      isUsingAuth === undefined ||
      (me && me.role === undefined) || // TODO: not sure this happens
      !links.users ||
      !links.organizations
    ) {
      return <div className="page-spinner" />
    }

    return (
      this.props.children &&
      React.cloneElement(this.props.children, Object.assign({}, this.props))
    )
  },
})

const mapStateToProps = ({links, auth, me}) => ({
  links,
  auth,
  me,
})

export default connect(mapStateToProps)(withRouter(CheckAdmin))
