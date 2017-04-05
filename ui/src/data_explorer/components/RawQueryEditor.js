import React, {PropTypes} from 'react'
import classNames from 'classnames'

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
      e.preventDefault()
      this.handleUpdate()
    } else if (e.keyCode === ESCAPE) {
      this.setState({value: this.state.value}, () => {
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
    const {query: {rawStatus}} = this.props
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
          placeholder="Enter a query..."
          autoComplete="off"
          spellCheck="false"
        />
        {this.renderStatus(rawStatus)}
      </div>
    )
  },

  renderStatus(rawStatus) {
    if (!rawStatus) {
      return (
        <div className="raw-text--status"></div>
      )
    }

    return (
      <div className={classNames("raw-text--status", {"raw-text--error": rawStatus.error, "raw-text--success": rawStatus.success, "raw-text--warning": rawStatus.warn})}>
        <span className={classNames("icon", {stop: rawStatus.error, checkmark: rawStatus.success, "alert-triangle": rawStatus.warn})}></span>
        {rawStatus.error || rawStatus.warn || rawStatus.success}
      </div>
    )
  },
})

export default RawQueryEditor
