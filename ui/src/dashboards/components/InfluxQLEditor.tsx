// Libraries
import React, {Component, MouseEvent} from 'react'
import _ from 'lodash'
import classnames from 'classnames'

// Components
import ReactCodeMirror from 'src/dashboards/components/ReactCodeMirror'
import TemplateDrawer from 'src/shared/components/TemplateDrawer'
import QueryStatus from 'src/shared/components/QueryStatus'
import {ErrorHandling} from 'src/shared/decorators/errors'
import {Dropdown, DropdownMode, ComponentStatus} from 'src/reusable_ui'
import {Button, ComponentColor, ComponentSize} from 'src/reusable_ui'

// Utils
import {getDeep} from 'src/utils/wrappers'
import {makeCancelable} from 'src/utils/promises'

// Constants
import {MATCH_INCOMPLETE_TEMPLATES, applyMasks} from 'src/tempVars/constants'
import {METAQUERY_TEMPLATE_OPTIONS} from 'src/data_explorer/constants'

// Types
import {Template, QueryConfig} from 'src/types'
import {WrappedCancelablePromise} from 'src/types/promises'
import {
  MetaQueryTemplateOption,
  DropdownChildTypes,
} from 'src/data_explorer/constants'
import {isExcludedStatement} from '../../utils/queryFilter'

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
  submitted: Map<number, boolean>
  configID: string
  isExcluded: boolean
}

interface Props {
  query: string
  onUpdate: (text: string, isAutoSubmitted: boolean) => Promise<void>
  config: QueryConfig
  templates: Template[]
  onMetaQuerySelected: () => void
  activeQueryIndex: number
}

const FIRST_TEMP_VAR = '0.tempVar'

const BLURRED_EDITOR_STATE = {
  focused: false,
  isTemplating: false,
  isShowingTemplateValues: false,
}

const TEMPLATE_VAR = /[:]\w+[:]/g

class InfluxQLEditor extends Component<Props, State> {
  public static getDerivedStateFromProps(nextProps: Props, prevState: State) {
    const {submitted, editedQueryText} = prevState
    const {query, activeQueryIndex, config, templates} = nextProps
    const isSubmitted = submitted.get(activeQueryIndex)??true
    const isQueryConfigChanged = config.id !== prevState.configID
    const isQueryTextChanged = editedQueryText.trim() !== query.trim()
    console.log(
      `getDerivedStateFromProps: ${nextProps.activeQueryIndex}, isSubmitted: ${isSubmitted}, submitted: ${JSON.stringify(submitted)}\n\teditedQueryText: ${editedQueryText.substring(0, Math.min(editedQueryText.length, 20))}, query: ${query.substring(0, Math.min(query.length, 20))}
\tisQueryConfigChanged: ${isQueryConfigChanged}, isQueryTextChanged: ${isQueryTextChanged}, isManuallySubmitted: ${config.isManuallySubmitted}, isLoading: ${config.status?.loading}`
    )
    if ((isSubmitted && isQueryTextChanged) || isQueryConfigChanged) {
      return {
        ...BLURRED_EDITOR_STATE,
        selectedTemplate: {
          tempVar: getDeep<string>(templates, FIRST_TEMP_VAR, ''),
        },
        filteredTemplates: templates,
        templatingQueryText: query,
        editedQueryText: query,
        configID: config.id,
        focused: isQueryConfigChanged,
      }
    }

    return null
  }

  private codeMirrorRef: React.RefObject<InstanceType<typeof ReactCodeMirror>>
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
      configID: props.config.id,
      submitted: new Map(),
      isExcluded: false,
    }
    console.log(
      `Constructor: ${props.activeQueryIndex}, isSubmitted ${this.state.submitted}`
    )
  }

  public componentWillUnmount() {
    this.cancelPendingUpdates()
  }

  public componentDidMount() {
    this.handleFocusEditor()
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
      submitted,
    } = this.state

    const isSubmitted = submitted.get(this.props.activeQueryIndex)??true
    return (
      <div className="query-editor" onMouseDown={this.handleMouseDown}>
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
          onBlur={this.handleBlurEditor}
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
    const isSubmitted = this.state.submitted.get(this.props.activeQueryIndex)??true
    console.log(
      `handleBlurEditor: ${this.props.activeQueryIndex}, isSubmitted: ${isSubmitted}`
    )
    this.setState({focused: false, isShowingTemplateValues: false})
    this.handleUpdate(true)
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
    const {templates, query, activeQueryIndex} = this.props
    //const {templates, activeQueryIndex} = this.props
    const isEditedChanged = value !== this.state.editedQueryText
    const isSubmittedState = this.state.submitted.get(activeQueryIndex)??true
    //const isSubmitted = isExcludedStatement(value)? isSubmittedState :value.trim() === query.trim()
    const isSubmitted = value.trim() === query.trim()
    console.log(`handleChange: ${activeQueryIndex}, isSubmitted ${isSubmitted}, isSubmittedState: ${isSubmittedState}, isEditedChanged: ${isEditedChanged}`)

    if (!isEditedChanged || this.state.isShowingTemplateValues) {
      return
    }

    // mask matches that will confuse our regex
    const masked = applyMasks(value)
    const matched = masked.match(MATCH_INCOMPLETE_TEMPLATES)

    const isTemplating = matched && !_.isEmpty(templates)
    if (isTemplating) {
      // maintain cursor position
      const matchedVar = {tempVar: `${matched[0]}:`}
      const filteredTemplates = this.filterTemplates(matched[0])
      const selectedTemplate = this.selectMatchingTemplate(
        filteredTemplates,
        matchedVar
      )

      this.setState({
        isTemplating,
        templatingQueryText: value,
        selectedTemplate,
        filteredTemplates,
        editedQueryText: value,
        submitted: new Map(this.state.submitted).set(activeQueryIndex, isSubmitted)
      })
    } else {
      const isExcluded =  isExcludedStatement(value)
      this.setState({
        isTemplating,
        isExcluded,
        templatingQueryText: value,
        editedQueryText: value,
        submitted: new Map(this.state.submitted).set(activeQueryIndex, isSubmitted)
      })
    }
    //this.setSubmitted(isSubmitted)
  }

  private setSubmitted = (isSubmitted: boolean): void => {
    const {activeQueryIndex} = this.props
    console.log(`setSubmitted: ${activeQueryIndex}, isSubmitted ${isSubmitted}`)
    this.setState({submitted: new Map(this.state.submitted).set(activeQueryIndex, isSubmitted)})
  }

  private handleUpdate = async (isAutoSubmitted?: boolean): Promise<void> => {
    const {onUpdate, activeQueryIndex, config} = this.props
    const {editedQueryText, submitted, isExcluded} = this.state
    const isSubmitted = submitted.get(activeQueryIndex)??true
    if (!this.isDisabled && (!isSubmitted || !config.isManuallySubmitted)) {
      this.cancelPendingUpdates()
      const update = onUpdate(editedQueryText, isAutoSubmitted)
      const cancelableUpdate = makeCancelable(update)

      this.pendingUpdates = [...this.pendingUpdates, cancelableUpdate]

      try {
        await cancelableUpdate.promise
        // prevent changing submitted status when edited while awaiting update
        if (this.state.editedQueryText === editedQueryText && ((!isAutoSubmitted && isExcluded) || !isExcluded)) {
          this.setSubmitted(true)
          console.log(`handleUpdate: ${activeQueryIndex}, set isSubmitted true`)
        }
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
    }
    return getDeep<TempVar>(filteredTemplates, '0', defaultVar)
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

  private handleShowTemplateValues = (): void => {
    this.setState({
      isShowingTemplateValues: true,
    })
  }

  private handleChooseMetaQuery = (mqto: MetaQueryTemplateOption): void => {
    if (this.props.onMetaQuerySelected) {
      this.props.onMetaQuerySelected()
    }
    this.handleChange(mqto.query)
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
      <div className="query-editor--status-actions">
        <Button
          size={ComponentSize.ExtraSmall}
          onClick={this.handleShowTemplateValues}
          text="Show Template Values"
          titleText={tempVarButtonTitle}
          status={
            (isTemplating || queryHasNoTempVars) && ComponentStatus.Disabled
          }
        />
        <Dropdown
          titleText="Metaquery Templates"
          mode={DropdownMode.ActionList}
          onChange={this.handleChooseMetaQuery}
          buttonSize={ComponentSize.ExtraSmall}
          widthPixels={163}
        >
          {METAQUERY_TEMPLATE_OPTIONS.map(mqto => {
            if (mqto.type === DropdownChildTypes.Item) {
              return (
                <Dropdown.Item
                  key={(mqto as MetaQueryTemplateOption).id}
                  id={(mqto as MetaQueryTemplateOption).text}
                  value={mqto}
                >
                  {(mqto as MetaQueryTemplateOption).text}
                </Dropdown.Item>
              )
            } else if (mqto.type === DropdownChildTypes.Divider) {
              return <Dropdown.Divider key={mqto.id} id={mqto.id} />
            }
          })}
        </Dropdown>
        <Button
          size={ComponentSize.ExtraSmall}
          color={ComponentColor.Primary}
          status={this.isDisabled && ComponentStatus.Disabled}
          onClick={() => this.handleUpdate()}
          text="Submit Query"
        />
      </div>
    )
  }
}

export default ErrorHandling(InfluxQLEditor)
