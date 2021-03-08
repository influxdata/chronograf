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
  configID: string
}

interface Props {
  query: string
  onUpdate: (text: string) => Promise<void>
  config: QueryConfig
  templates: Template[]
  onMetaQuerySelected: () => void
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
    const {isSubmitted, editedQueryText} = prevState

    const isQueryConfigChanged = nextProps.config.id !== prevState.configID
    const isQueryTextChanged = editedQueryText.trim() !== nextProps.query.trim()

    if ((isSubmitted && isQueryTextChanged) || isQueryConfigChanged) {
      return {
        ...BLURRED_EDITOR_STATE,
        selectedTemplate: {
          tempVar: getDeep<string>(nextProps.templates, FIRST_TEMP_VAR, ''),
        },
        filteredTemplates: nextProps.templates,
        templatingQueryText: nextProps.query,
        editedQueryText: nextProps.query,
        configID: nextProps.config.id,
        focused: isQueryConfigChanged,
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
      configID: props.config.id,
    }
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
      isSubmitted,
    } = this.state

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
    this.setState({focused: false, isShowingTemplateValues: false})
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

    const isTemplating = matched && !_.isEmpty(templates)
    if (isTemplating) {
      // maintain cursor poition
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
        isSubmitted,
      })
    } else {
      this.setState({
        isTemplating,
        templatingQueryText: value,
        editedQueryText: value,
        isSubmitted,
      })
    }
  }

  private handleUpdate = async (): Promise<void> => {
    const {onUpdate} = this.props

    if (!this.isDisabled && !this.state.isSubmitted) {
      const {editedQueryText} = this.state
      this.cancelPendingUpdates()
      const update = onUpdate(editedQueryText)
      const cancelableUpdate = makeCancelable(update)

      this.pendingUpdates = [...this.pendingUpdates, cancelableUpdate]

      try {
        await cancelableUpdate.promise

        // prevent changing submitted status when edited while awaiting update
        if (this.state.editedQueryText === editedQueryText) {
          this.setState({isSubmitted: true})
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

  private handleShowTemplateValues = async (): Promise<void> => {
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
          children={METAQUERY_TEMPLATE_OPTIONS.map(mqto => {
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
          onChange={this.handleChooseMetaQuery}
          buttonSize={ComponentSize.ExtraSmall}
          widthPixels={163}
        />
        <Button
          size={ComponentSize.ExtraSmall}
          color={ComponentColor.Primary}
          status={this.isDisabled && ComponentStatus.Disabled}
          onClick={this.handleUpdate}
          text="Submit Query"
        />
      </div>
    )
  }
}

export default InfluxQLEditor
