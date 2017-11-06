import * as React from 'react'
import * as PropTypes from 'prop-types'

const PanelBody = ({children}) =>
  <div className="panel-body text-center">
    <h3 className="deluxe">How to resolve:</h3>
    <p>
      {children}
    </p>
  </div>

const {node} = PropTypes

PanelBody.propTypes = {
  children: node.isRequired,
}

export default PanelBody
