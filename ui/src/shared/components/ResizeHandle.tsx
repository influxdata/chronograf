import * as React from 'react'
import * as PropTypes from 'prop-types'
import classnames from 'classnames'

const ResizeHandle = ({isDragging, onHandleStartDrag, top}) =>
  <div
    className={classnames('resizer--handle', {dragging: isDragging})}
    onMouseDown={onHandleStartDrag}
    style={{top}}
  />

const {func, bool, string} = PropTypes

ResizeHandle.propTypes = {
  onHandleStartDrag: func.isRequired,
  isDragging: bool.isRequired,
  top: string,
}

export default ResizeHandle
