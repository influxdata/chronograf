import * as React from 'react'
import * as PropTypes from 'prop-types'

const EmptyRow = ({tableName}) =>
  <tr className="table-empty-state">
    <th colSpan="5">
      <p>
        You don't have any {tableName},<br />why not create one?
      </p>
    </th>
  </tr>

const {string} = PropTypes

EmptyRow.propTypes = {
  tableName: string.isRequired,
}

export default EmptyRow
