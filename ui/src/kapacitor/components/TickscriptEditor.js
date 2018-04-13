import React, {Component} from 'react'
import PropTypes from 'prop-types'
import {Controlled as CodeMirror} from 'react-codemirror2'
import 'src/external/codemirror'

class TickscriptEditor extends Component {
  constructor(props) {
    super(props)
  }

  updateCode = (editor, data, script) => {
    this.props.onChangeScript(script)
  }

  render() {
    const {script} = this.props

    const options = {
      lineNumbers: true,
      theme: 'material',
      tabIndex: 1,
    }

    return (
      <div className="tickscript-editor">
        <CodeMirror
          autoCursor={true}
          autoFocus={true}
          value={script}
          onChange={this.updateCode}
          onBeforeChange={this.updateCode}
          options={options}
        />{' '}
      </div>
    )
  }
}

const {func, string} = PropTypes

TickscriptEditor.propTypes = {
  onChangeScript: func,
  script: string,
}

export default TickscriptEditor
