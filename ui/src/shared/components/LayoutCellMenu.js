import React, {PropTypes, Component} from 'react'
import OnClickOutside from 'react-onclickoutside'
import CustomTimeIndicator from 'shared/components/CustomTimeIndicator'

const LayoutCellMenu = ({
  cell,
  onEdit,
  queries,
  onDelete,
  isEditable,
  dataExists,
  isDeleting,
  onDeleteClick,
  onCSVDownload,
}) =>
  <div className="dash-graph-context">
    <div
      className={`${isEditable
        ? 'dash-graph--custom-indicators dash-graph--draggable'
        : 'dash-graph--custom-indicators'}`}
    >
      {queries && <CustomTimeIndicator queries={queries} />}
    </div>
    {isEditable &&
      <div className="dash-graph-context--buttons">
        <div className="dash-graph-context--button" onClick={onEdit(cell)}>
          <span className="icon pencil" />
        </div>
        {dataExists &&
          <div
            className="dash-graph-context--button"
            onClick={onCSVDownload(cell)}
          >
            <span className="icon download" />
          </div>}
        {isDeleting
          ? <div className="dash-graph-context--button active">
              <span className="icon trash" />
              <div
                className="dash-graph-context--confirm"
                onClick={onDelete(cell)}
              >
                Confirm
              </div>
            </div>
          : <div className="dash-graph-context--button" onClick={onDeleteClick}>
              <span className="icon trash" />
            </div>}
      </div>}
  </div>

class LayoutCellMenuWrapper extends Component {
  onClickOutside() {
    this.props.onCloseMenu()
  }

  render() {
    return <LayoutCellMenu {...this.props} />
  }
}

const {arrayOf, bool, func, shape} = PropTypes

LayoutCellMenuWrapper.propTypes = {
  isDeleting: bool,
  onEdit: func,
  onDelete: func,
  onDeleteClick: func,
  cell: shape(),
  isEditable: bool,
  dataExists: bool,
  onCloseMenu: func.isRequired,
  queries: arrayOf(shape()),
}

LayoutCellMenu.propTypes = LayoutCellMenuWrapper.propTypes

export default OnClickOutside(LayoutCellMenuWrapper)
