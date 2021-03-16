// Libraries
import React, {PureComponent} from 'react'
import classnames from 'classnames'
import _ from 'lodash'
import {Controlled} from 'react-codemirror2'
import {Editor as CMEditor} from 'codemirror'

import {ErrorHandling} from 'src/shared/decorators/errors'
import {createMarkerElement} from 'src/dashboards/utils/influxQLEditor'
import {getLocalSelectedValue, getSelectedValue} from 'src/tempVars/utils'
import replaceTemplates, {replaceInterval} from 'src/tempVars/utils/replace'

import {duration} from 'src/shared/apis/query'

import {applyMasks, insertTempVar, unMask} from 'src/tempVars/constants'

import {Template, QueryConfig} from 'src/types'
import {EditorChange, EditorConfiguration, Position} from 'codemirror'

interface State {
  markers: CodeMirror.TextMarker[]
}

interface Selection {
  start: Position
  end: Position
}

interface Props {
  value: string
  focused: boolean
  readOnly: boolean
  config: QueryConfig
  selectedTemplate: TempVar
  templates: Template[]
  filteredTemplates: Template[]
  isTemplating: boolean
  isShowingTemplateValues: boolean
  onFocus: () => void
  onBlur: () => void
  onChange: (value: string) => void
  onKeyDown: (e: KeyboardEvent) => void
  onBeforeChange: (value: string) => void
  onTemplateSelection: (selected: TempVar, text: string) => void
}

const CODE_MIRROR_OPTIONS: CodeMirror.EditorConfiguration = {
  tabindex: 1,
  mode: 'influxQL',
  readOnly: false,
  lineNumbers: false,
  theme: 'influxql',
  lineWrapping: true,
  autofocus: true,
}

interface EditorToken {
  string: string
  type: string
  start: Position
  end: Position
}
interface TempVar {
  tempVar: string
}

enum SelectionDirection {
  Missing,
  Next,
  Previous,
}

const NOOP = () => {}

const TEMPLATE_TYPES = ['temp-system', 'temp-var']

@ErrorHandling
class ReactCodeMirror extends PureComponent<Props, State> {
  private editor?: CMEditor

  public render() {
    const {value, onFocus, onBlur} = this.props

    return (
      <div className={this.queryCodeClassName}>
        <Controlled
          autoCursor={true}
          options={this.options}
          onTouchStart={NOOP}
          value={value}
          onChange={this.handleChange}
          onFocus={onFocus}
          onBlur={onBlur}
          onKeyDown={this.handleKeyDownEditor}
          editorWillUnmount={this.handleUnmountEditor}
          editorDidMount={this.handleMountEditor}
          onBeforeChange={this.handleBeforeChange}
        />
      </div>
    )
  }

  public componentDidUpdate(prevProps: Props) {
    if (
      this.props.isShowingTemplateValues !== prevProps.isShowingTemplateValues
    ) {
      if (this.props.isShowingTemplateValues) {
        this.showTemplateValues()
      } else {
        this.hideTemplateValues()
      }
    }

    if (this.props.focused && this.editor && !this.editor.hasFocus()) {
      this.focusEditor()
    }
  }

  public handleTemplateReplace = (
    selectedTemplate: TempVar,
    replaceWholeTemplate: boolean
  ): void => {
    if (!selectedTemplate) {
      return
    }

    const {value} = this.props
    const {tempVar} = selectedTemplate
    const newTempVar = replaceWholeTemplate
      ? tempVar
      : tempVar.substring(0, tempVar.length - 1)

    // mask matches that will confuse our regex
    const masked = applyMasks(value)

    let templatedQueryText
    templatedQueryText = insertTempVar(masked, newTempVar)
    templatedQueryText = unMask(templatedQueryText)

    this.props.onTemplateSelection(selectedTemplate, templatedQueryText)

    const selection = this.getTemplateSelection(
      masked,
      newTempVar,
      replaceWholeTemplate
    )

    if (this.editor) {
      this.editor.getDoc().setSelection(selection.end, selection.start)
    }
  }

  private focusEditor() {
    this.props.onFocus()
    this.editor.focus()
  }

  private handleMountEditor = (editor: CMEditor) => {
    this.editor = editor
  }

  private handleUnmountEditor = () => {
    this.editor = null
  }

  private handleBeforeChange = (
    __: CMEditor,
    ___: EditorChange,
    value: string
  ): void => {
    this.props.onBeforeChange(value)
  }

  private handleChange = (
    __: CMEditor,
    ___: EditorChange,
    value: string
  ): void => {
    this.props.onChange(value)
  }

  private handleKeyDownEditor = (__: CMEditor, e: KeyboardEvent): void => {
    this.handleTemplatingKeys(e)
    this.props.onKeyDown(e)
  }

  private get options(): EditorConfiguration {
    const {readOnly} = this.props

    return {
      ...CODE_MIRROR_OPTIONS,
      readOnly,
      theme: readOnly ? 'influxql-read-only' : CODE_MIRROR_OPTIONS.theme,
      mode: readOnly ? 'influxQLReadOnly' : CODE_MIRROR_OPTIONS.mode,
    }
  }

  private get queryCodeClassName(): string {
    const {focused, readOnly} = this.props

    return classnames('query-editor--code', {
      focus: focused,
      'read-only': readOnly,
    })
  }

  private showTemplateValues = async (): Promise<void> => {
    const markers = await this.replaceTemplateTokens()

    this.setState({
      markers,
    })

    if (this.editor) {
      this.editor.focus()
    }
  }

  private hideTemplateValues() {
    const {markers} = this.state

    markers.forEach(m => {
      m.clear()
    })

    this.setState({markers: []})
  }

  private handleTemplatingKeys = (e: KeyboardEvent): void => {
    const {isTemplating} = this.props

    if (isTemplating) {
      switch (e.key) {
        case 'Tab':
        case 'ArrowRight':
        case 'ArrowDown':
          e.preventDefault()
          return this.handleTemplateReplace(
            this.findTempVar(SelectionDirection.Next),
            false
          )
        case 'ArrowLeft':
        case 'ArrowUp':
          e.preventDefault()
          return this.handleTemplateReplace(
            this.findTempVar(SelectionDirection.Previous),
            false
          )
        case 'Enter':
          e.preventDefault()
          this.handleTemplateReplace(this.props.selectedTemplate, true)
      }
    }
  }

  private findTempVar(selection: SelectionDirection): Template {
    const {filteredTemplates: templates, selectedTemplate} = this.props

    const i = _.findIndex(templates, selectedTemplate)
    const length = templates.length

    if (i === -1) {
      selection = SelectionDirection.Missing
    }

    switch (selection) {
      case SelectionDirection.Next:
        return templates[(i + 1) % length]
      case SelectionDirection.Previous:
        return templates[(i - 1 + length) % length]
      default:
        return templates[0]
    }
  }

  private replaceTemplateTokens = async (): Promise<
    CodeMirror.TextMarker[]
  > => {
    if (!this.editor) {
      return
    }

    const {templates} = this.props

    const allTokens = this.getTemplateTokens()
    const [intervalTokens, otherTokens] = _.partition(
      allTokens,
      t => t.string === ':interval:'
    )

    const tokenMarkers = otherTokens.map(template => {
      const {string: tempVar, start, end} = template
      const found = templates.find(t => t.tempVar === tempVar)

      if (found) {
        const selected = getSelectedValue(found)
        const localSelected = getLocalSelectedValue(found)
        const value = selected || localSelected

        const replacedWith: HTMLElement = createMarkerElement(tempVar, value)

        return this.editor.getDoc().markText(start, end, {replacedWith})
      }
    })

    const intervalMarkers = await this.getIntervalMarkers(intervalTokens)

    return _.compact([...tokenMarkers, ...intervalMarkers])
  }

  // requires an API call to get the duration used in the query
  private getIntervalMarkers = async (
    intervalTokens
  ): Promise<CodeMirror.TextMarker[]> => {
    if (_.isEmpty(intervalTokens)) {
      return []
    }

    const durationValue = await this.fetchQueryInterval()

    return intervalTokens.map(({start, end}) => {
      const replacedWith: HTMLElement = createMarkerElement(
        ':interval:',
        durationValue
      )

      return this.editor.getDoc().markText(start, end, {replacedWith})
    })
  }

  private fetchQueryInterval = async (): Promise<string> => {
    const {value, templates, config} = this.props

    const query = replaceTemplates(value, templates)
    const durationMs = await duration(query, config.source)

    return replaceInterval(':interval:', durationMs)
  }

  private getTemplateTokens() {
    return _.flatten(this.editorTokens).filter(t =>
      TEMPLATE_TYPES.includes(t.type)
    )
  }

  private get editorTokens(): EditorToken[][] {
    if (!this.editor) {
      return
    }

    const lineCount = this.editor.getDoc().lineCount()
    return _.times(lineCount, line => {
      const tokens = this.editor.getLineTokens(line)

      const editorTokens: EditorToken[] = tokens.map(token => ({
        ...token,
        start: {line, ch: token.start},
        end: {line, ch: token.end},
      }))

      return editorTokens
    })
  }

  private getTemplateSelection(
    maskedText: string,
    newTempVar: string,
    replaceWholeTemplate: boolean
  ): Selection {
    // unicode safe template start index lookup
    const startIndex = Array.from(maskedText).indexOf(':')
    const position = this.editor.getDoc().posFromIndex(startIndex)
    const enterModifier = replaceWholeTemplate ? 1 : 0

    const charStart = 1 + startIndex
    const tempVarLength = newTempVar.length - 1 + enterModifier

    const end = {
      line: position.line,
      ch: charStart + tempVarLength,
    }

    let start = end

    if (!replaceWholeTemplate) {
      start = {
        line: position.line,
        ch: charStart,
      }
    }

    return {start, end}
  }
}

export default ReactCodeMirror
