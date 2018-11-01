import _ from 'lodash'
import React, {PureComponent} from 'react'
import {Controlled as ReactCodeMirror, IInstance} from 'react-codemirror2'
import {EditorChange, LineWidget} from 'codemirror'
import {ShowHintOptions} from 'src/types/codemirror'
import {ErrorHandling} from 'src/shared/decorators/errors'
import {OnChangeScript, Suggestion} from 'src/types/flux'
import {getSuggestions, EXCLUDED_KEYS} from 'src/flux/helpers/autoComplete'
import 'src/external/codemirror'

interface Gutter {
  line: number
  text: string
}

interface Status {
  type: string
  text: string
}

interface Props {
  script: string
  visibility: string
  status: Status
  onChangeScript: OnChangeScript
  onSubmitScript: () => void
  suggestions: Suggestion[]
}

interface Widget extends LineWidget {
  node: HTMLElement
}

interface State {
  lineWidgets: Widget[]
}

interface EditorInstance extends IInstance {
  showHint: (options?: ShowHintOptions) => void
}

@ErrorHandling
class FluxScriptEditor extends PureComponent<Props, State> {
  private editor: EditorInstance
  private lineWidgets: Widget[] = []

  constructor(props) {
    super(props)
  }

  public componentDidUpdate(prevProps) {
    const {status, visibility} = this.props

    if (status.type === 'error') {
      this.makeError()
    }

    if (status.type !== 'error') {
      this.editor.clearGutter('error-gutter')
      this.clearWidgets()
    }

    if (prevProps.visibility === visibility) {
      return
    }

    if (visibility === 'visible') {
      setTimeout(() => this.editor.refresh(), 60)
    }
  }

  public render() {
    const {script, children} = this.props

    const options = {
      tabIndex: 1,
      mode: 'flux',
      readonly: false,
      lineNumbers: true,
      autoRefresh: true,
      indentUnit: 2,
      smartIndent: false,
      electricChars: false,
      theme: 'time-machine',
      completeSingle: false,
      gutters: ['error-gutter'],
    }

    return (
      <div className="flux-script-editor">
        <ReactCodeMirror
          autoFocus={true}
          autoCursor={true}
          value={script}
          options={options}
          onBeforeChange={this.updateCode}
          onTouchStart={this.onTouchStart}
          editorDidMount={this.handleMount}
          onKeyUp={this.handleKeyUp}
        />
        {children}
      </div>
    )
  }

  private makeError(): void {
    this.editor.clearGutter('error-gutter')
    const lineNumbers = this.statusLine
    lineNumbers.forEach(({line, text}) => {
      const lineNumber = line - 1
      this.editor.setGutterMarker(
        lineNumber,
        'error-gutter',
        this.errorMarker(text, lineNumber)
      )
    })

    this.editor.refresh()
  }

  private errorMarker(message: string, line: number): HTMLElement {
    const span = document.createElement('span')
    span.className = 'icon stop error-warning'
    span.title = message
    span.addEventListener('click', this.handleClickError(message, line))
    return span
  }

  private handleClickError = (text: string, line: number) => () => {
    let widget = this.lineWidgets.find(w => w.node.textContent === text)

    if (widget) {
      return this.clearWidget(widget)
    }

    const errorDiv = document.createElement('div')
    errorDiv.className = 'inline-error-message'
    errorDiv.innerText = text
    widget = this.editor.addLineWidget(line, errorDiv) as Widget

    this.lineWidgets = [...this.lineWidgets, widget]
  }

  private clearWidget = (widget: Widget): void => {
    widget.clear()
    this.lineWidgets = this.lineWidgets.filter(
      w => w.node.textContent !== widget.node.textContent
    )
  }

  private clearWidgets = () => {
    this.lineWidgets.forEach(w => {
      w.clear()
    })

    this.lineWidgets = []
  }

  private get statusLine(): Gutter[] {
    const {status} = this.props
    const messages = status.text.split('\n')
    const lineNumbers = messages
      .map(text => {
        const [numbers] = text.split(' ')
        const [lineNumber] = numbers.split(':')
        return {line: Number(lineNumber), text}
      })
      .filter(d => !isNaN(d.line))

    return lineNumbers
  }

  private handleMount = (instance: EditorInstance) => {
    instance.refresh() // required to for proper line height on mount
    this.editor = instance
  }

  private onTouchStart = () => {}

  private handleKeyUp = (__, e: KeyboardEvent) => {
    const {ctrlKey, key} = e

    if (ctrlKey && key === ' ') {
      this.showAutoComplete()

      return
    }

    if (ctrlKey && key === 'Enter') {
      this.props.onSubmitScript()

      return
    }

    if (ctrlKey || EXCLUDED_KEYS.has(key)) {
      return
    }

    this.showAutoComplete()
  }

  private showAutoComplete() {
    const {suggestions} = this.props
    const filteredSuggestions = getSuggestions(this.editor, suggestions)

    if (!filteredSuggestions.list.length) {
      return
    }

    this.editor.showHint({
      hint: () => filteredSuggestions,
      completeSingle: false,
    })
  }

  private updateCode = (
    ___: IInstance,
    ____: EditorChange,
    script: string
  ): void => {
    this.props.onChangeScript(script)
  }
}

export default FluxScriptEditor
