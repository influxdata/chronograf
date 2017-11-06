import * as React from 'react'
import * as PropTypes from 'prop-types'
import {Link} from 'react-router-dom'

const NoKapacitorError = ({source}) =>
  <div className="graph-empty">
    <p>
      The current source does not have an associated Kapacitor instance
      <br />
      <br />
      <Link
        to={`/sources/${source.id}/kapacitors/new`}
        className="btn btn-sm btn-primary"
      >
        Configure Kapacitor
      </Link>
    </p>
  </div>

NoKapacitorError.propTypes = {
  source: PropTypes.shape({
    id: PropTypes.string.isRequired,
  }).isRequired,
}

export default NoKapacitorError
