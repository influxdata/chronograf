import React, {PropTypes} from 'react'

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
  },

  getInitialState() {
    return {
      buttonsOpen: false,
    }
  },

  toggleButtons() {
    const {buttonsOpen} = this.state
    this.setState({
      buttonsOpen: !buttonsOpen,
    })
  },

  renderButtons() {
    if (this.state.buttonsOpen) {
      return (
        <div style={{width: "50%", float: "right"}}>
          <button>foo</button>
          <button>bar</button>
          <button onClick={this.toggleButtons}>&middot;&middot;&middot;</button>
        </div>
      )
    }
    return (
      <div style={{width: "50%", float: "right"}}>
        <button onClick={this.toggleButtons}>&middot;&middot;&middot;</button>
      </div>
    )
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
          }}
        />
      )
    } else {
      nameOrField = (<span className="dash-graph--name">{name}</span>)
    }

    let onClickHandler
    if (isEditable) {
      onClickHandler = onEditCell
    } else {
      onClickHandler = () => {
        // no-op
      }
    }

    return (
      <div>
        <div>
          <h2 style={{width: "50%"}} className="dash-graph--heading" onClick={onClickHandler(x, y, isEditing)}>{nameOrField}</h2>
          {this.renderButtons()}
        </div>
        <div className="dash-graph--container">
          {children}
        </div>
      </div>
    )
  },
})

export default NameableGraph;
