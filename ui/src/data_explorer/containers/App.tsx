import * as React from 'react'
import * as PropTypes from 'prop-types'
import {withRouter} from 'react-router-dom'
import DataExplorer from './DataExplorer'

const App = ({source}) =>
  <div className="page">
    <DataExplorer source={source} />
  </div>

App.propTypes = {
  source: PropTypes.shape({
    links: PropTypes.shape({
      proxy: PropTypes.string.isRequired,
      self: PropTypes.string.isRequired,
    }).isRequired,
  }).isRequired,
}

export default withRouter(App)
