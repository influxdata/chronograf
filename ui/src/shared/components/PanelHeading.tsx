import * as React from 'react'
import * as PropTypes from 'prop-types'

const PanelHeading = () =>
  <div className="panel-heading text-center">
    <h2 className="deluxe">
      {this.props.children}
    </h2>
  </div>

const {node} = PropTypes

PanelHeading.propTypes = {
  children: node.isRequired,
}

export default PanelHeading
