import React, {PropTypes} from 'react'

const NameableGraph = React.createClass({
  propTypes: {
    name: PropTypes.string.isRequired,
  },

  getInitialState() {
    return {
      editing: false,
      name: this.props.name,
    }
  },

  handleClick() {
    this.setState({
      editing: !this.state.editing,
    });
  },

  handleChangeName(evt) {
    this.setState({
      name: evt.target.value,
    });
  },

  render() {
    let nombre
    if (!this.state.editing) {
      nombre = this.state.name
    } else {
      nombre = <input type="text" value={this.state.name} autoFocus onChange={this.handleChangeName}></input>
    }

    return (
      <div>
        <h2 className="dash-graph--heading" onClick={this.handleClick}>{nombre}</h2>
        <div className="dash-graph--container">
          {this.props.children}
        </div>
      </div>
    );
  },
});

export default NameableGraph;
