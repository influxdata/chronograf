import React, {PropTypes} from 'react'
import classnames from 'classnames'
import OnClickOutside from 'react-onclickoutside'

const {
  bool,
  func,
  node,
  number,
  shape,
  string,
} = PropTypes

const NameableGraph = React.createClass({
  propTypes: {
    cell: shape({
      name: string.isRequired,
      isEditing: bool,
      x: number.isRequired,
      y: number.isRequired,
    }).isRequired,
    children: node.isRequired,
    onEditCell: func,
    onRenameCell: func,
    onUpdateCell: func,
    onDeleteCell: func,
    onSummonOverlayTechnologies: func,
    shouldNotBeEditable: bool,
  },

  getInitialState() {
    return {
      isMenuOpen: false,
    }
  },

  toggleMenu() {
    this.setState({
      isMenuOpen: !this.state.isMenuOpen,
    })
  },

  closeMenu() {
    this.setState({
      isMenuOpen: false,
    })
  },

  render() {
    const {
      cell,
      cell: {
        x,
        y,
        name,
        isEditing,
      },
      onEditCell,
      onRenameCell,
      onUpdateCell,
      onDeleteCell,
      onSummonOverlayTechnologies,
      shouldNotBeEditable,
      children,
    } = this.props

    const isEditable = !!(onEditCell || onRenameCell || onUpdateCell)

    let nameOrField
    if (isEditing && isEditable) {
      nameOrField = (
        <input
          className="form-control input-sm dash-graph--name-edit"
          type="text"
          value={name}
          autoFocus={true}
          onChange={onRenameCell(x, y)}
          onBlur={onUpdateCell(cell)}
          onKeyUp={(evt) => {
            if (evt.key === 'Enter') {
              onUpdateCell(cell)()
            }
            if (evt.key === 'Escape') {
              onEditCell(x, y, true)()
            }
          }}
        />
      )
    } else {
      nameOrField = (<span className="dash-graph--name">{name}</span>)
    }

    let onStartRenaming
    if (!isEditing && isEditable) {
      onStartRenaming = onEditCell
    } else {
      onStartRenaming = () => {
        // no-op
      }
    }

    return (
      <div className="dash-graph">
        <div className={classnames("dash-graph--heading", {"dash-graph--heading-draggable": !shouldNotBeEditable})}>{nameOrField}</div>
        {
          shouldNotBeEditable ?
          null :
          <ContextMenu
            isOpen={this.state.isMenuOpen}
            toggleMenu={this.toggleMenu}
            onEdit={onSummonOverlayTechnologies}
            onRename={onStartRenaming}
            onDelete={onDeleteCell}
            cell={cell}
            handleClickOutside={this.closeMenu}
          />
        }
        <div className="dash-graph--container">
          {children}
        </div>
      </div>
    )
  },
})

const ContextMenu = OnClickOutside(({isOpen, toggleMenu, onEdit, onRename, onDelete, cell}) => (
  <div className={classnames("dash-graph--options", {"dash-graph--options-show": isOpen})} onClick={toggleMenu}>
    <button className="btn btn-info btn-xs">
      <span className="icon caret-down"></span>
    </button>
    <ul className="dash-graph--options-menu">
      <li onClick={() => onEdit(cell)}>Edit</li>
      <li onClick={onRename(cell.x, cell.y, cell.isEditing)}>Rename</li>
      <li onClick={() => onDelete(cell)}>Delete</li>
    </ul>
  </div>
))
export default NameableGraph
