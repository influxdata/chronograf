import * as React from 'react'
import * as PropTypes from 'prop-types'

import {OVERLAY_TECHNOLOGY} from 'shared/constants/classNames'

const OverlayTechnologies = ({children}) =>
  <div className={OVERLAY_TECHNOLOGY}>
    {children}
  </div>

const {node} = PropTypes

OverlayTechnologies.propTypes = {
  children: node.isRequired,
}

export default OverlayTechnologies
