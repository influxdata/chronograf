import * as React from 'react'
import * as PropTypes from 'prop-types'
import CodeMirror from '@skidding/react-codemirror'
import 'external/codemirror'

class TickscriptEditor extends React.Component {
  constructor(props) {
    super(props)
  }

  updateCode = script => {
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
      <CodeMirror value={script} onChange={this.updateCode} options={options} />
    )
  }
}

const {func, string} = PropTypes

TickscriptEditor.propTypes = {
  onChangeScript: func,
  script: string,
}

export default TickscriptEditor
