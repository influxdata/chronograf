// Libraries
import React, {
  PureComponent,
  ComponentClass,
  ChangeEvent,
  KeyboardEvent,
} from 'react'
import {connect} from 'react-redux'
import {withRouter} from 'react-router'
import {isEmpty} from 'lodash'

// Utils
import {ErrorHandling} from 'src/shared/decorators/errors'
import {getDeep} from 'src/utils/wrappers'
import {formatTempVar} from 'src/tempVars/utils'
import {
  reconcileSelectedAndLocalSelectedValues,
  pickSelected,
} from 'src/dashboards/utils/tempVars'

// Actions
import {notify as notifyActionCreator} from 'src/shared/actions/notifications'

// Components
import ConfirmButton from 'src/shared/components/ConfirmButton'
import OverlayContainer from 'src/reusable_ui/components/overlays/OverlayContainer'
import OverlayHeading from 'src/reusable_ui/components/overlays/OverlayHeading'
import OverlayBody from 'src/reusable_ui/components/overlays/OverlayBody'
import Dropdown from 'src/shared/components/Dropdown'
import DatabasesTemplateBuilder from 'src/tempVars/components/DatabasesTemplateBuilder'
import CSVTemplateBuilder from 'src/tempVars/components/CSVTemplateBuilder'
import MapTemplateBuilder from 'src/tempVars/components/MapTemplateBuilder'
import MeasurementsTemplateBuilder from 'src/tempVars/components/MeasurementsTemplateBuilder'
import FieldKeysTemplateBuilder from 'src/tempVars/components/FieldKeysTemplateBuilder'
import TagKeysTemplateBuilder from 'src/tempVars/components/TagKeysTemplateBuilder'
import TagValuesTemplateBuilder from 'src/tempVars/components/TagValuesTemplateBuilder'
import MetaQueryTemplateBuilder from 'src/tempVars/components/MetaQueryTemplateBuilder'
import TextTemplateBuilder from 'src/tempVars/components/TextTemplateBuilder'
import SourceDropdown from 'src/flux/components/SourceDropdown'

// Types
import {
  Template,
  TemplateType,
  TemplateValue,
  TemplateBuilderProps,
  Source,
  RemoteDataState,
  Notification,
  QueryType,
} from 'src/types'

// Constants
import {
  TEMPLATE_TYPES_LIST,
  DEFAULT_TEMPLATES,
  RESERVED_TEMPLATE_NAMES,
} from 'src/tempVars/constants'
import {FIVE_SECONDS} from 'src/shared/constants/index'

interface Props {
  // We will assume we are creating a new template if none is passed in
  template?: Template
  templates: Template[]
  source: Source
  sources: Source[]
  onCancel: () => void
  onCreate?: (template: Template) => Promise<any>
  onUpdate?: (template: Template) => Promise<any>
  onDelete?: () => Promise<any>
  notify: (n: Notification) => void
  isDynamicSourceSelected: boolean
}

interface State {
  nextTemplate: Template
  isNew: boolean
  savingStatus: RemoteDataState
  deletingStatus: RemoteDataState
  isDynamicSourceSelected: boolean
  selectedSource: Source
}

const TEMPLATE_BUILDERS = {
  [TemplateType.Databases]: DatabasesTemplateBuilder,
  [TemplateType.CSV]: CSVTemplateBuilder,
  [TemplateType.Map]: MapTemplateBuilder,
  [TemplateType.Measurements]: MeasurementsTemplateBuilder,
  [TemplateType.FieldKeys]: FieldKeysTemplateBuilder,
  [TemplateType.TagKeys]: TagKeysTemplateBuilder,
  [TemplateType.TagValues]: TagValuesTemplateBuilder,
  [TemplateType.MetaQuery]: MetaQueryTemplateBuilder,
  [TemplateType.Text]: TextTemplateBuilder,
}

const DEFAULT_TEMPLATE = DEFAULT_TEMPLATES[TemplateType.Databases]

const DYNAMIC_SOURCE_DATABASE_ID = 'dynamic'

@ErrorHandling
class TemplateVariableEditor extends PureComponent<Props, State> {
  // See comment in source changing handler functions at the bottom of the file
  private key: number = +new Date()

  constructor(props) {
    super(props)

    let sourceID: string
    let selectedSource: Source

    // If props.template exists, we're loading a source. If it doesn't, we're creating one
    if (props.template && props.template.sourceID) {
      sourceID = props.template.sourceID
      selectedSource = props.sources.find(source => source.id === sourceID)
      if (!selectedSource) {
        const v = props.template.tempVar
        console.error(
          `Variable '${v}' uses source '${sourceID}' that does not exist.`
        )
        sourceID = DYNAMIC_SOURCE_DATABASE_ID
      }
    } else {
      sourceID = DYNAMIC_SOURCE_DATABASE_ID
    }

    const isDynamicSourceSelected = sourceID === DYNAMIC_SOURCE_DATABASE_ID
    if (!selectedSource) {
      // The source id of the current dynamic source is available as a url param
      selectedSource = props.sources.find(
        source => source.id === props.params.sourceID
      )
    }

    const defaultState = {
      savingStatus: RemoteDataState.NotStarted,
      deletingStatus: RemoteDataState.NotStarted,
      isDynamicSourceSelected,
      selectedSource,
    }

    const {template} = this.props

    if (template) {
      this.state = {
        ...defaultState,
        nextTemplate: {...template},
        isNew: false,
      }
    } else {
      this.state = {
        ...defaultState,
        nextTemplate: DEFAULT_TEMPLATE(),
        isNew: true,
      }
    }
  }

  public render() {
    const {sources, onCancel, notify, templates} = this.props
    const {
      isDynamicSourceSelected,
      selectedSource,
      nextTemplate,
      isNew,
    } = this.state
    const TemplateBuilder = this.templateBuilder

    return (
      <OverlayContainer maxWidth={650}>
        <OverlayHeading title={this.title}>
          <div className="btn-group--right">
            <button
              className="btn btn-default btn-sm"
              type="button"
              onClick={onCancel}
            >
              Cancel
            </button>
            <button
              className="btn btn-success btn-sm"
              type="button"
              onClick={this.handleSave}
              disabled={!this.canSave}
            >
              {this.saveButtonText}
            </button>
          </div>
        </OverlayHeading>
        <OverlayBody>
          <div className="faux-form">
            <div className="form-group col-sm-4">
              <label>Data Source</label>
              <SourceDropdown
                onSelectDynamicSource={this.handleSelectDynamicSource}
                sources={sources}
                source={selectedSource}
                isDynamicSourceSelected={isDynamicSourceSelected}
                onChangeSource={this.handleChangeSource}
                allowDynamicSource={true}
                type={QueryType.InfluxQL}
                widthPixels={0}
                zIndex={'9999'}
              />
            </div>
            <div className="form-group col-sm-4">
              <label>Name</label>
              <input
                type="text"
                className="form-control input-sm form-astronaut"
                value={nextTemplate.tempVar}
                onChange={this.handleChangeName}
                onKeyPress={this.handleNameKeyPress}
                onBlur={this.formatName}
                spellCheck={false}
              />
            </div>
            <div className="form-group col-sm-4">
              <label>Type</label>
              <Dropdown
                items={TEMPLATE_TYPES_LIST}
                onChoose={this.handleChooseType}
                selected={this.dropdownSelection}
                buttonSize="btn-sm"
                className="dropdown-stretch"
              />
            </div>
            <TemplateBuilder
              key={this.key}
              template={nextTemplate}
              templates={templates}
              source={selectedSource}
              onUpdateTemplate={this.handleUpdateTemplate}
              notify={notify}
              onUpdateDefaultTemplateValue={
                this.handleUpdateSelectedTemplateValue
              }
            />
            <div className="form-group text-center form-group-submit col-xs-12">
              <ConfirmButton
                text={this.confirmText}
                confirmAction={this.handleDelete}
                type="btn-danger"
                size="btn-sm"
                customClass="delete"
                disabled={isNew || this.isDeleting}
              />
            </div>
          </div>
        </OverlayBody>
      </OverlayContainer>
    )
  }

  private get confirmText(): string {
    if (this.isDeleting) {
      return 'Deleting...'
    }

    return 'Delete'
  }

  private get title(): string {
    const {isNew} = this.state

    let prefix = 'Edit'

    if (isNew) {
      prefix = 'Create'
    }

    return `${prefix} Template Variable`
  }

  private get templateBuilder(): ComponentClass<TemplateBuilderProps> {
    const {
      nextTemplate: {type},
    } = this.state

    const component = TEMPLATE_BUILDERS[type]

    if (!component) {
      throw new Error(`Could not find template builder for type "${type}"`)
    }

    return component
  }

  private handleUpdateSelectedTemplateValue = (
    selected: TemplateValue
  ): void => {
    const {
      nextTemplate,
      nextTemplate: {values},
    } = this.state

    const nextValues = values.map(v => {
      if (v.value === selected.value) {
        return {...v, selected: true}
      }
      return {...v, selected: false}
    })

    this.setState({nextTemplate: {...nextTemplate, values: nextValues}})
  }

  private handleUpdateTemplate = (nextNextTemplate: Template): void => {
    const {nextTemplate} = this.state

    const templateWithSelectedAndLocalSelected = reconcileSelectedAndLocalSelectedValues(
      nextTemplate,
      nextNextTemplate
    )

    this.setState({nextTemplate: templateWithSelectedAndLocalSelected})
  }

  private handleChooseType = ({type}) => {
    const {
      nextTemplate: {id, tempVar},
    } = this.state

    const nextNextTemplate = {
      ...DEFAULT_TEMPLATES[type](),
      id,
      tempVar,
    }

    this.setState({nextTemplate: nextNextTemplate})
  }

  private handleChangeName = (e: ChangeEvent<HTMLInputElement>): void => {
    const {value} = e.target
    const {nextTemplate} = this.state

    this.setState({
      nextTemplate: {
        ...nextTemplate,
        tempVar: value,
      },
    })
  }

  private formatName = (): void => {
    const {nextTemplate} = this.state

    let tempVar = formatTempVar(nextTemplate.tempVar)

    if (tempVar === '::') {
      tempVar = ''
    }

    this.setState({nextTemplate: {...nextTemplate, tempVar}})
  }

  private handleSave = async (): Promise<any> => {
    if (!this.canSave) {
      return
    }
    const {onUpdate, onCreate, notify} = this.props
    const {
      nextTemplate,
      isNew,
      isDynamicSourceSelected,
      selectedSource,
    } = this.state

    nextTemplate.sourceID = DYNAMIC_SOURCE_DATABASE_ID

    if (!isDynamicSourceSelected) {
      nextTemplate.sourceID = selectedSource.id
    }

    nextTemplate.tempVar = formatTempVar(nextTemplate.tempVar)

    this.setState({savingStatus: RemoteDataState.Loading})

    try {
      if (isNew) {
        const updatedTemplate = pickSelected(nextTemplate)
        await onCreate(updatedTemplate)
      } else {
        await onUpdate(nextTemplate)
      }
    } catch (error) {
      notify({
        message: `Error saving template: ${error}`,
        type: 'error',
        icon: 'alert-triangle',
        duration: FIVE_SECONDS,
      })
      console.error(error)
    }
  }

  private handleNameKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      this.handleSave()
    }
  }

  private get isSaving(): boolean {
    return this.state.savingStatus === RemoteDataState.Loading
  }

  private get canSave(): boolean {
    const {
      nextTemplate: {tempVar, type, values},
    } = this.state

    let canSaveValues = true
    if (type === TemplateType.CSV && isEmpty(values)) {
      canSaveValues = false
    }

    return (
      tempVar !== '' &&
      canSaveValues &&
      !RESERVED_TEMPLATE_NAMES.includes(formatTempVar(tempVar)) &&
      !this.isSaving
    )
  }

  private get dropdownSelection(): string {
    const {
      nextTemplate: {type},
    } = this.state

    return getDeep(
      TEMPLATE_TYPES_LIST.filter(t => t.type === type),
      '0.text',
      ''
    )
  }

  private get saveButtonText(): string {
    const {isNew} = this.state

    if (this.isSaving && isNew) {
      return 'Creating...'
    }

    if (this.isSaving && !isNew) {
      return 'Saving...'
    }

    if (!this.isSaving && isNew) {
      return 'Create'
    }

    return 'Save'
  }

  private handleSelectDynamicSource = () => {
    this.setState({
      isDynamicSourceSelected: true,
    })
    // Changing this key to be the current timestamp then passing it to the current templateBuilder
    // forces a re-mount, which re-runs its query, which gets the proper data when we change the source.
    // A bit of a hack, sorry.
    this.key = +new Date()
  }

  private handleChangeSource = (source: Source) => {
    this.setState({
      isDynamicSourceSelected: false,
      selectedSource: source,
    })
    // Changing this key to be the current timestamp then passing it to the current templateBuilder
    // forces a re-mount, which re-runs its query, which gets the proper data when we change the source.
    // A bit of a hack, sorry.
    this.key = +new Date()
  }

  private handleDelete = (): void => {
    const {onDelete} = this.props

    this.setState({deletingStatus: RemoteDataState.Loading}, onDelete)
  }

  private get isDeleting(): boolean {
    return this.state.deletingStatus === RemoteDataState.Loading
  }
}

const mdtp = {
  notify: notifyActionCreator,
}

const mstp = state => {
  const {sources} = state

  return {
    sources,
  }
}

export default connect(mstp, mdtp)(withRouter(TemplateVariableEditor))
