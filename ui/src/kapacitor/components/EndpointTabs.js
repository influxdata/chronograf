import React, {PropTypes} from 'react'
import classnames from 'classnames'
import uuid from 'node-uuid'

const EndpointTabs = ({
  endpointsOnThisAlert,
  selectedEndpoint,
  handleChooseAlert,
  handleRemoveEndpoint,
}) => {
  return endpointsOnThisAlert.length
    ? <ul className="nav nav-tablist nav-tablist-sm nav-tablist-malachite">
        {endpointsOnThisAlert.map(ep =>
          <li
            key={uuid.v4()}
            className={classnames({
              active: ep.alias === (selectedEndpoint && selectedEndpoint.alias),
            })}
            onClick={handleChooseAlert(ep)}
          >
            {ep.alias}
            <div
              className="nav-tab--delete"
              onClick={handleRemoveEndpoint(ep)}
            />
          </li>
        )}
      </ul>
    : null
}

const {shape, func, array} = PropTypes

EndpointTabs.propTypes = {
  endpointsOnThisAlert: array,
  selectedEndpoint: shape({}),
  handleChooseAlert: func.isRequired,
  handleRemoveEndpoint: func.isRequired,
}

export default EndpointTabs
