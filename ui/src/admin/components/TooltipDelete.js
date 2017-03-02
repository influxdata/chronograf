import React, {Component, PropTypes} from 'react'
import Tooltip from 'rc-tooltip'

const Delete = (deleteHandler) => (
  <div className="influx-tooltip place-bottom">
    Are you sure?
    <div onClick={deleteHandler}>🗑</div>
  </div>
)

const TooltipDelete = ({
  onDelete,
}) => (
  <Tooltip
    placement={'bottom'}
    overlay={Delete(onDelete)}
    destroyTooltipOnHide={true}
  >
    <div className="btn btn-info btn-sm">
      Delete
    </div>
  </Tooltip>
)

export default TooltipDelete
