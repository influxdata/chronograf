// Libraries
import React, {Component, MouseEvent} from 'react'
import _ from 'lodash'
import classnames from 'classnames'

// Components
import ReactCodeMirror from 'src/dashboards/components/ReactCodeMirror'
import TemplateDrawer from 'src/shared/components/TemplateDrawer'
import QueryStatus from 'src/shared/components/QueryStatus'
import {ErrorHandling} from 'src/shared/decorators/errors'
import OnClickOutside from 'src/shared/components/OnClickOutside'

// Utils
import {getDeep} from 'src/utils/wrappers'
import {makeCancelable} from 'src/utils/promises'

// Constants
import {MATCH_INCOMPLETE_TEMPLATES, applyMasks} from 'src/tempVars/constants'

// Types
import {Template, QueryConfig} from 'src/types'
import {WrappedCancelablePromise} from 'src/types/promises'

interface TempVar {
  tempVar: string
}

interface State {
  focused: boolean
  editedQueryText: string
  templatingQueryText: string
  isTemplating: boolean
  selectedTemplate: TempVar
  isShowingTemplateValues: boolean
  filteredTemplates: Template[]
  isSubmitted: boolean
}

interface Props {
  query: string
  onUpdate: (text: string) => Promise<void>
  config: QueryConfig
  templates: Template[]
  onClickOutside: () => void
}

const FIRST_TEMP_VAR = '0.tempVar'

const BLURRED_EDITOR_STATE = {
  focused: false,
  isTemplating: false,
  isShowingTemplateValues: false,
}

const TEMPLATE_VAR = /[:]\w+[:]/g

@ErrorHandling
class InfluxQLEditor extends Component<Props, State> {
  public static getDerivedStateFromProps(nextProps: Props, prevState: State) {
    const {isSubmitted, isShowingTemplateValues, editedQueryText} = prevState

    if (
      isSubmitted &&
      !isShowingTemplateValues &&
      editedQueryText.trim() !== nextProps.query.trim()
    ) {
      return {
        ...BLURRED_EDITOR_STATE,
        selectedTemplate: {
          tempVar: getDeep<string>(nextProps.templates, FIRST_TEMP_VAR, ''),
        },
        filteredTemplates: nextProps.templates,
        templatingQueryText: nextProps.query,
        editedQueryText: nextProps.query,
      }
    }

    return null
  }

  private codeMirrorRef: React.RefObject<ReactCodeMirror>
  private pendingUpdates: Array<WrappedCancelablePromise<void>>

  constructor(props: Props) {
    super(props)

    this.codeMirrorRef = React.createRef()
    this.pendingUpdates = []

    this.state = {
      ...BLURRED_EDITOR_STATE,
      selectedTemplate: {
        tempVar: getDeep<string>(props.templates, FIRST_TEMP_VAR, ''),
      },
      filteredTemplates: props.templates,
      templatingQueryText: props.query,
      editedQueryText: props.query,
      isSubmitted: true,
    }
  }

  public componentWillUnmount() {
    this.cancelPendingUpdates()
  }

  public render() {
    const {config, templates} = this.props

    const {
      templatingQueryText,
      isTemplating,
      selectedTemplate,
      filteredTemplates,
      isShowingTemplateValues,
      focused,
      isSubmitted,
    } = this.state

    return (
      <div
        className="query-editor"
        onMouseDown={this.handleMouseDown}
        onBlur={this.handleBlurEditor}
      >
        {this.dismissPreviewButton}
        <ReactCodeMirror
          ref={this.codeMirrorRef}
          focused={focused}
          value={templatingQueryText}
          config={config}
          templates={templates}
          isTemplating={isTemplating}
          selectedTemplate={selectedTemplate}
          filteredTemplates={filteredTemplates}
          readOnly={isShowingTemplateValues}
          onChange={this.handleChange}
          onFocus={this.handleFocusEditor}
          isShowingTemplateValues={isShowingTemplateValues}
          onKeyDown={this.handleKeyDownEditor}
          onBeforeChange={this.handleUpdateTemplatingQueryText}
          onTemplateSelection={this.handleTemplateSelection}
        />
        <div
          className={classnames('varmoji', {
            'varmoji-rotated': isTemplating,
            focus: focused,
            'read-only': isShowingTemplateValues,
          })}
        >
          <div className="varmoji-container">
            <div className="varmoji-front">
              <QueryStatus
                status={config.status}
                isShowingTemplateValues={isShowingTemplateValues}
                isSubmitted={isSubmitted}
              >
                {this.queryStatusButtons}
              </QueryStatus>
            </div>
            <div className="varmoji-back">
              {isTemplating ? (
                <TemplateDrawer
                  onClickTempVar={this.handleClickTempVar}
                  templates={filteredTemplates}
                  selected={selectedTemplate}
                  onMouseOverTempVar={this.handleMouseOverTempVar}
                  handleClickOutside={this.handleCloseDrawer}
                />
              ) : null}
            </div>
          </div>
        </div>
      </div>
    )
  }

  public handleClickOutside = (): void => {
    this.setState({focused: false})

    this.hideTemplateValues()
    this.handleBlurEditor()
  }

  private handleTemplateSelection = (
    selectedTemplate: TempVar,
    templatingQueryText: string
  ) => {
    this.setState({
      selectedTemplate,
      templatingQueryText,
      editedQueryText: templatingQueryText,
    })
  }

  private handleFocusEditor = (): void => {
    this.setState({focused: true})
  }

  private handleBlurEditor = (): void => {
    this.handleUpdate()
  }

  private handleCloseDrawer = (): void => {
    this.setState({isTemplating: false})
  }

  private handleMouseOverTempVar = (template: Template) => () => {
    const codeMirror = this.codeMirrorRef.current
    codeMirror.handleTemplateReplace(template, false)
  }

  private handleClickTempVar = (template: Template) => () => {
    // Clicking a tempVar does the same thing as hitting 'Enter'
    const codeMirror = this.codeMirrorRef.current
    codeMirror.handleTemplateReplace(template, true)
    this.closeDrawer()
  }

  private handleMouseDown = (e: MouseEvent): void => {
    this.setState({focused: true})

    e.stopPropagation()
    e.preventDefault()
  }

  private handleUpdateTemplatingQueryText = (value: string): void => {
    this.setState({templatingQueryText: value})
  }

  private handleChange = (value: string): void => {
    const {templates, query} = this.props
    const isEditedChanged = value !== this.state.editedQueryText
    const isSubmitted = value.trim() === query.trim()

    if (!isEditedChanged || this.state.isShowingTemplateValues) {
      return
    }

    // mask matches that will confuse our regex
    const masked = applyMasks(value)
    const matched = masked.match(MATCH_INCOMPLETE_TEMPLATES)

    if (matched && !_.isEmpty(templates)) {
      // maintain cursor poition
      const matchedVar = {tempVar: `${matched[0]}:`}
      const filteredTemplates = this.filterTemplates(matched[0])
      const selectedTemplate = this.selectMatchingTemplate(
        filteredTemplates,
        matchedVar
      )

      this.setState({
        isTemplating: true,
        templatingQueryText: value,
        selectedTemplate,
        filteredTemplates,
        editedQueryText: value,
        isSubmitted,
      })
    } else {
      this.setState({
        isTemplating: false,
        editedQueryText: value,
        isSubmitted,
      })
    }
  }

  private handleUpdate = async (): Promise<void> => {
    if (!this.isDisabled && !this.state.isSubmitted) {
      this.cancelPendingUpdates()

      const update = this.props.onUpdate(this.state.editedQueryText)
      const cancelableUpdate = makeCancelable(update)

      this.pendingUpdates = [...this.pendingUpdates, cancelableUpdate]

      try {
        await cancelableUpdate
        this.setState({isSubmitted: true})
      } catch (error) {
        if (!error.isCanceled) {
          console.error(error)
        }
      } finally {
        this.pendingUpdates = this.pendingUpdates.filter(
          p => p !== cancelableUpdate
        )
      }
    }
  }

  private filterTemplates(matchText: string): Template[] {
    const {templates} = this.props
    const filterText = matchText.substr(1).toLowerCase()

    return templates.filter(t => t.tempVar.toLowerCase().includes(filterText))
  }

  private selectMatchingTemplate(
    filteredTemplates: Template[],
    defaultVar: TempVar
  ): TempVar {
    const {selectedTemplate} = this.state

    const found = filteredTemplates.find(
      t => selectedTemplate && t.tempVar === selectedTemplate.tempVar
    )

    if (found) {
      return found
    } else {
      return getDeep<TempVar>(filteredTemplates, '0', defaultVar)
    }
  }

  private handleKeyDownEditor = (e: KeyboardEvent): void => {
    const {isTemplating} = this.state

    if (isTemplating) {
      switch (e.key) {
        case 'Enter':
          e.preventDefault()
          return this.closeDrawer()
        case 'Escape':
          e.preventDefault()
          return this.closeDrawer()
      }
    } else if (e.key === 'Escape') {
      e.preventDefault()
      this.setState({isTemplating: false})
    } else if (e.key === 'Enter') {
      e.preventDefault()
      this.handleUpdate()
    }
  }

  private handleHideAndFocus = (): void => {
    this.setState({isShowingTemplateValues: false, focused: true})
  }

  private handleShowTemplateValues = async (): Promise<void> => {
    this.setState({
      isShowingTemplateValues: true,
    })
  }

  private closeDrawer = () => {
    this.setState({
      isTemplating: false,
      selectedTemplate: {
        tempVar: getDeep<string>(this.props.templates, FIRST_TEMP_VAR, ''),
      },
    })
  }

  private cancelPendingUpdates() {
    this.pendingUpdates.forEach(p => {
      p.cancel()
    })
  }

  private get isDisabled(): boolean {
    return this.state.isTemplating || this.state.isShowingTemplateValues
  }

  private get dismissPreviewButton(): JSX.Element {
    const {isShowingTemplateValues} = this.state

    if (isShowingTemplateValues) {
      return (
        <button
          className="query-editor--dismiss"
          onClick={this.handleHideAndFocus}
        />
      )
    }
    return null
  }

  private get queryStatusButtons(): JSX.Element {
    const {isTemplating, editedQueryText} = this.state
    const queryHasNoTempVars = !editedQueryText.match(TEMPLATE_VAR)

    let tempVarButtonTitle = 'See substituted Template Variable values'

    if (queryHasNoTempVars) {
      tempVarButtonTitle = 'Query has no Template Variables to preview'
    }

    return (
      <>
        <button
          onClick={this.handleShowTemplateValues}
          className="btn btn-xs btn-info query-editor--submit"
          disabled={isTemplating || queryHasNoTempVars}
          title={tempVarButtonTitle}
        >
          Show Template Values
        </button>
        <button
          className="btn btn-xs btn-primary query-editor--submit"
          onClick={this.handleUpdate}
          disabled={this.isDisabled}
        >
          Submit Query
        </button>
      </>
    )
  }
}

export default OnClickOutside(InfluxQLEditor)
