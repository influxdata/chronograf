import React, {SFC} from 'react'
import classnames from 'classnames'
import {isCellUntitled} from 'src/dashboards/utils/cellGetters'

interface Props {
  isEditable: boolean
  cellName: string
  cellNote: string
}

const LayoutCellHeader: SFC<Props> = ({isEditable, cellName, cellNote}) => {
  const headingClass = `dash-graph--heading ${
    isEditable ? 'dash-graph--draggable dash-graph--heading-draggable' : ''
  }`

  return (
    <div className={headingClass}>
      <span
        className={classnames('dash-graph--name', {
          'dash-graph--name__default': isCellUntitled(cellName),
          'dash-graph--name__note': !!cellNote,
        })}
      >
        {cellName}
      </span>
    </div>
  )
}

export default LayoutCellHeader
