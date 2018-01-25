import React, {PropTypes} from 'react'
import {connect} from 'react-redux'
import {bindActionCreators} from 'redux'

import SideNav from 'src/side_nav'
import Notifications from 'shared/components/Notifications'

import {publishNotification} from 'shared/actions/notifications'

const {func, node} = PropTypes

const App = React.createClass({
  propTypes: {
    children: node.isRequired,
    notify: func.isRequired,
  },

  handleAddFlashMessage({type, text}) {
    const {notify} = this.props

    notify(type, text)
  },

  render() {
    return (
      <div className="chronograf-root">
        <link
          href="https://api.tiles.mapbox.com/mapbox-gl-js/v0.43.0/mapbox-gl.css"
          rel="stylesheet"
        />
        <link
          href="https://api.mapbox.com/mapbox-assembly/mbx/v0.18.0/assembly.min.css"
          rel="stylesheet"
        />

        <Notifications />
        <SideNav />
        {this.props.children &&
          React.cloneElement(this.props.children, {
            addFlashMessage: this.handleAddFlashMessage,
          })}
      </div>
    )
  },
})

const mapDispatchToProps = dispatch => ({
  notify: bindActionCreators(publishNotification, dispatch),
})

export default connect(null, mapDispatchToProps)(App)
