import * as React from 'react'
import * as PropTypes from 'prop-types'

import CustomTimeIndicator from 'shared/components/CustomTimeIndicator'

import {NEW_DEFAULT_DASHBOARD_CELL} from 'dashboards/constants/index'

const LayoutCellHeader = ({queries, isEditable, cellName}) => {
  const cellNameIsDefault = cellName === NEW_DEFAULT_DASHBOARD_CELL.name

  const headingClass = `dash-graph--heading ${isEditable
    ? 'dash-graph--heading-draggable'
    : ''}`

  return (
    <div className={headingClass}>
      <span
        className={
          cellNameIsDefault
            ? 'dash-graph--name dash-graph--name__default'
            : 'dash-graph--name'
        }
      >
        {cellName}
        <div className="dash-graph--custom-indicators">
          {queries && queries.length
            ? <CustomTimeIndicator queries={queries} />
            : null}
        </div>
      </span>
    </div>
  )
}

const {arrayOf, bool, shape, string} = PropTypes

LayoutCellHeader.propTypes = {
  queries: arrayOf(shape()),
  isEditable: bool,
  cellName: string,
}

export default LayoutCellHeader
