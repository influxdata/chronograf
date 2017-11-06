import * as React from 'react'
import * as PropTypes from 'prop-types'

const EmptyQueryState = ({onAddQuery}) =>
  <div className="query-maker--empty">
    <h5>This Graph has no Queries</h5>
    <br />
    <div className="btn btn-primary" onClick={onAddQuery}>
      <span className="icon plus" /> Add a Query
    </div>
  </div>

const {func} = PropTypes

EmptyQueryState.propTypes = {
  onAddQuery: func.isRequired,
}

export default EmptyQueryState
