import React, {Component, PropTypes} from 'react'
import OnClickOutside from 'react-onclickoutside'

const LayoutCellMenu = ({
  isDeleting,
  onEdit,
  onDeleteClick,
  onDelete,
  onCSVDownload,
  dataExists,
  cell,
}) =>
  <div
    className={
      isDeleting
        ? 'dash-graph-context dash-graph-context__deleting'
        : 'dash-graph-context'
    }
  >
    <div className="dash-graph-context--button" onClick={onEdit(cell)}>
      <span className="icon pencil" />
    </div>
    {dataExists
      ? <div
          className="dash-graph-context--button"
          onClick={onCSVDownload(cell)}
        >
          <span className="icon download" />
        </div>
      : null}
    {isDeleting
      ? <div className="dash-graph-context--button active">
          <span className="icon trash" />
          <div className="dash-graph-context--confirm" onClick={onDelete(cell)}>
            Confirm
          </div>
        </div>
      : <div className="dash-graph-context--button" onClick={onDeleteClick}>
          <span className="icon trash" />
        </div>}
  </div>

class LayoutCellMenuContainer extends Component {
  handleClickOutside() {
    this.props.onCloseMenu()
  }

  render() {
    if (!this.props.isEditable) {
      return null
    }

    return <LayoutCellMenu {...this.props} />
  }
}

const {bool, func, shape} = PropTypes

LayoutCellMenuContainer.propTypes = {
  isDeleting: bool,
  onEdit: func,
  onDelete: func,
  onDeleteClick: func,
  onCloseMenu: func,
  cell: shape(),
  isEditable: bool,
  dataExists: bool,
}

LayoutCellMenu.propTypes = LayoutCellMenuContainer.propTypes

export default OnClickOutside(LayoutCellMenuContainer)
