import React, {PropTypes} from 'react'

const ENTER = 13
const ESCAPE = 27
const RawQueryEditor = React.createClass({
  propTypes: {
    query: PropTypes.shape({
      rawText: PropTypes.string.isRequired,
      id: PropTypes.string.isRequired,
    }).isRequired,
    onUpdate: PropTypes.func.isRequired,
  },

  getInitialState() {
    return {
      value: this.props.query.rawText,
    }
  },

  componentWillReceiveProps(nextProps) {
    if (nextProps.query.rawText !== this.props.query.rawText) {
      this.setState({value: nextProps.query.rawText})
    }
  },

  handleKeyDown(e) {
    if (e.keyCode === ENTER) {
      this.handleUpdate()
      this.editor.blur()
    } else if (e.keyCode === ESCAPE) {
      this.setState({value: this.props.query.rawText}, () => {
        this.editor.blur()
      })
    }
  },

  handleChange() {
    this.setState({
      value: this.editor.value,
    })
  },

  handleUpdate() {
    this.props.onUpdate(this.state.value)
  },

  render() {
    const {value} = this.state

    return (
      <div className="raw-text">
        <textarea
          className="raw-text--field"
          onChange={this.handleChange}
          onKeyDown={this.handleKeyDown}
          onBlur={this.handleUpdate}
          ref={(editor) => this.editor = editor}
          value={value}
          placeholder="Blank query"
        />
      </div>
    )
  },
})

export default RawQueryEditor
