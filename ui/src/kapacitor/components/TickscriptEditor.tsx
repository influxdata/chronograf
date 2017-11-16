import * as React from 'react'
import * as CodeMirror from '@skidding/react-codemirror'
import 'external/codemirror'

export interface TickscriptEditorProps {
  onChangeScript: (script: string) => void
  script: string
}

const updateCode = (onChangeScript, script: string) => _e => {
  onChangeScript(script)
}

const TickscriptEditor: React.SFC<TickscriptEditorProps> = ({
  script,
  onChangeScript,
}) => {
  const options = {
    lineNumbers: true,
    theme: 'material',
    tabIndex: 1,
  }

  return (
    <CodeMirror
      value={script}
      onChange={updateCode(onChangeScript, script)}
      options={options}
    />
  )
}

export default TickscriptEditor
