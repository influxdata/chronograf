// Libraries
import React, {Component} from 'react'
import {connect} from 'react-redux'
import _ from 'lodash'

// Components
import {ErrorHandling} from 'src/shared/decorators/errors'
import KapacitorDropdown from 'src/sources/components/KapacitorDropdown'
import KapacitorForm from 'src/sources/components/KapacitorForm'

// Utils
import ActiveKapacitorFromSources from 'src/kapacitor/utils/ActiveKapacitorFromSources'

// Actions
import {notify as notifyAction} from 'src/shared/actions/notifications'
import * as sourcesActions from 'src/shared/actions/sources'

// APIs
import {createKapacitor, updateKapacitor, pingKapacitor} from 'src/shared/apis'

// Constants
import {
  notifyKapacitorSuccess,
  notifyKapacitorUpdated,
  notifyCouldNotConnectToUpdatedKapacitor,
  notifyCouldNotConnectToKapacitor,
} from 'src/shared/copy/notifications'
import {DEFAULT_KAPACITOR} from 'src/shared/constants'

// Types
import {Kapacitor, Source} from 'src/types'
import {NextReturn} from 'src/types/wizard'

interface Props {
  notify: typeof notifyAction
  source: Source
  setError: (b: boolean) => void
  sources: Source[]
  onBoarding?: boolean
  kapacitor: Kapacitor
  deleteKapacitor: sourcesActions.DeleteKapacitor
  setActiveKapacitor: sourcesActions.SetActiveKapacitor
  fetchKapacitors: sourcesActions.FetchKapacitorsAsync
  showNewKapacitor?: boolean
  setKapacitorDraft?: (kapacitor: Kapacitor) => void
}

interface State {
  kapacitor: Kapacitor
}

const syncHostnames = (source: Source, kapacitor: Kapacitor) => {
  try {
    // new URL(input) throws error if input is not a valid url.
    if (source && source.url) {
      const sourceURL = new URL(source.url)
      const kapacitorURL = new URL(kapacitor.url)
      if (sourceURL.hostname) {
        kapacitorURL.hostname = sourceURL.hostname
        return {...kapacitor, url: kapacitorURL.href}
      }
    }
  } catch (e) {}

  return kapacitor
}

@ErrorHandling
class KapacitorStep extends Component<Props, State> {
  public static defaultProps: Partial<Props> = {
    onBoarding: false,
  }

  constructor(props: Props) {
    super(props)

    const activeKapacitor =
      ActiveKapacitorFromSources(props.source, props.sources) || props.kapacitor

    let kapacitor = syncHostnames(props.source, DEFAULT_KAPACITOR)

    if (!props.showNewKapacitor && activeKapacitor) {
      kapacitor = activeKapacitor
    }

    this.state = {kapacitor}
  }

  public next = async (): Promise<NextReturn> => {
    const {kapacitor} = this.state
    const {notify, source} = this.props
    const kapacitorExists = kapacitor.id
    if (kapacitorExists) {
      if (this.existingKapacitorHasChanged) {
        try {
          const {data: updatedKapacitor} = await updateKapacitor(kapacitor)

          await this.fetchNewKapacitors()
          await pingKapacitor(updatedKapacitor)

          notify(notifyKapacitorUpdated())

          this.setState({kapacitor: updatedKapacitor})

          return {error: false, payload: updatedKapacitor}
        } catch (error) {
          console.error(error)
          notify(notifyCouldNotConnectToUpdatedKapacitor(kapacitor.name))

          return {error: true, payload: null}
        }
      }
      return {error: false, payload: kapacitor}
    }

    try {
      const {data: newKapacitor} = await createKapacitor(source, kapacitor)

      await this.fetchNewKapacitors()
      await pingKapacitor(newKapacitor)

      this.setState({kapacitor: newKapacitor})

      notify(notifyKapacitorSuccess())

      return {error: false, payload: newKapacitor}
    } catch (error) {
      console.error(error)
      notify(notifyCouldNotConnectToKapacitor(kapacitor.name))
      return {error: true, payload: null}
    }
  }

  public render() {
    const {onBoarding} = this.props
    const {kapacitor} = this.state

    return (
      <>
        {!onBoarding && this.kapacitorDropdown}
        <KapacitorForm
          kapacitor={kapacitor}
          onChangeInput={this.onChangeInput}
        />
      </>
    )
  }

  private onChangeInput = (key: string) => (value: string | boolean) => {
    const {setError, setKapacitorDraft} = this.props
    const {kapacitor} = this.state

    this.setState({kapacitor: {...kapacitor, [key]: value}}, () => {
      if (setKapacitorDraft) {
        setKapacitorDraft(this.state.kapacitor)
      }
    })

    setError(false)
  }

  private handleSetActiveKapacitor = (kapacitor: Kapacitor) => {
    this.props.setActiveKapacitor(kapacitor)
    this.setState({
      kapacitor,
    })
  }

  private resetDefault = () => {
    this.setState({
      kapacitor: DEFAULT_KAPACITOR,
    })
  }

  private fetchNewKapacitors = () => {
    const {source, sources, fetchKapacitors} = this.props
    const storeSource = sources.find(s => s.id === source.id)
    fetchKapacitors(storeSource)
  }

  private get existingKapacitorHasChanged() {
    const {source, sources} = this.props
    const {kapacitor} = this.state

    const activeKapacitor = ActiveKapacitorFromSources(source, sources)
    return !_.isEqual(activeKapacitor, kapacitor)
  }

  private get kapacitorDropdown() {
    const {kapacitor} = this.state
    const {source, sources, deleteKapacitor} = this.props

    if (source && sources) {
      const storeSource = sources.find(s => s.id === source.id)

      return (
        <div className="kapacitor-step--dropdown col-xs-12">
          <div className="form-group col-xs-6">
            <KapacitorDropdown
              suppressEdit={true}
              source={storeSource}
              kapacitors={storeSource.kapacitors}
              deleteKapacitor={deleteKapacitor}
              setActiveKapacitor={this.handleSetActiveKapacitor}
              buttonSize="btn-sm"
              onAddNew={this.resetDefault}
              displayValue={!kapacitor.id && kapacitor.name}
            />
          </div>
        </div>
      )
    }
    return
  }
}

const mstp = ({sources}) => ({
  sources,
})

const mdtp = {
  notify: notifyAction,
  setActiveKapacitor: sourcesActions.setActiveKapacitorAsync,
  deleteKapacitor: sourcesActions.deleteKapacitorAsync,
  fetchKapacitors: sourcesActions.fetchKapacitorsAsyncNoNotify,
}

export default connect(mstp, mdtp, null, {withRef: true})(KapacitorStep)
