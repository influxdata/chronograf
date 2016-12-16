import React, {PropTypes} from 'react';
import classNames from 'classnames';

const ENTER = 13;
const ESCAPE = 27;
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
      queryOk: false,
      queryProcessing: true,
      queryError: false,
      queryValid: false,
    };
  },

  componentWillReceiveProps(nextProps) {
    if (nextProps.query.rawText !== this.props.query.rawText) {
      this.setState({value: nextProps.query.rawText});
    }
  },

  handleKeyDown(e) {
    if (e.keyCode === ENTER) {
      this.handleUpdate();
      this.editor.blur();
    } else if (e.keyCode === ESCAPE) {
      this.setState({value: this.props.query.rawText}, () => {
        this.editor.blur();
      });
    }
  },

  handleChange() {
    this.setState({
      value: this.editor.value,
    });
  },

  handleUpdate() {
    this.props.onUpdate(this.state.value);
    // Update error status here
  },

  renderQueryErrorStatus() {
    const {queryOk, queryProcessing, queryError, queryValid} = this.state;

    return (
      <div className={classNames("raw-text--status", {"status-waiting": queryOk}, {"status-processing": queryProcessing}, {"status-error": queryError}, {"status-valid": queryValid})}>
        <div className="raw-text--waiting">Waiting on Query</div>
        <div className="raw-text--processing">
          <span className="icon cubo-uniform"></span>
          Processing...
        </div>
        <div className="raw-text--error">Query has errors</div>
        <div className="raw-text--valid">Query OK</div>
      </div>
    );
  },

  render() {
    const {value} = this.state;

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
        {this.renderQueryErrorStatus()}
      </div>
    );
  },
});

export default RawQueryEditor;
