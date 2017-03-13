import React, {PropTypes} from 'react'

const NameableGraph = React.createClass({
  propTypes: {
    cell: PropTypes.shape({
      name: PropTypes.string.isRequired,
      id: PropTypes.string.isRequired,
    }).isRequired,
    children: PropTypes.node.isRequired,
    onRename: PropTypes.func.isRequired,
    renameHandler: PropTypes.func.isRequired,
  },

  handleClick() {
    this.setState({
      editing: !this.state.editing, /* eslint-disable no-negated-condition */
    });
  },

  handleChangeName() {
    this.props.onRename({
      ...this.props.cell,
      name: this.state.name,
    })
  },

  onHandleChange(id) {
    return (evt) => {
      this.props.renameHandler(id, evt.target.value)
    }
  },

  render() {
    let nameOrField

    const {cell: {name, id, editing}, children} = this.props

    if (!editing) {
      nameOrField = name
    } else {
      nameOrField = <input type="text" value={name} autoFocus={true} onChange={this.onHandleChange(id)} onBlur={this.handleChangeName}></input>
    }

    return (
      <div>
        <h2 className="dash-graph--heading" onClick={this.handleClick}>{nameOrField}</h2>
        <div className="dash-graph--container">
          {children}
        </div>
      </div>
    );
  },
});

export default NameableGraph;
