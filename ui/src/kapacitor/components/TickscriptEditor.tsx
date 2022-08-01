import React, {Component} from 'react'

import {Controlled as CodeMirror} from 'react-codemirror2'
import 'src/external/codemirror'

import {ErrorHandling} from 'src/shared/decorators/errors'

interface Props {
  onChangeScript: (tickscript: string) => void
  script: string
  readOnly?: boolean
}

const NOOP = () => {}

class TickscriptEditor extends Component<Props> {
  constructor(props) {
    super(props)
  }

  public render() {
    const {script, readOnly} = this.props

    const options = {
      lineNumbers: true,
      theme: 'tickscript',
      tabIndex: 1,
      readOnly: !!readOnly,
      mode: 'tickscript',
    }

    return (
      <div className="tickscript-editor">
        <CodeMirror
          value={script}
          onBeforeChange={this.updateCode}
          options={options}
          onTouchStart={NOOP}
        />
      </div>
    )
  }

  private updateCode = (_, __, script) => {
    this.props.onChangeScript(script)
  }
}

export default ErrorHandling(TickscriptEditor)
