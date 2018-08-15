// Libraries
import React, {Component} from 'react'
import {connect} from 'react-redux'
import _ from 'lodash'

// Components
import {ErrorHandling} from 'src/shared/decorators/errors'
import KapacitorDropdown from 'src/sources/components/KapacitorDropdown'
import KapacitorForm from 'src/sources/components/KapacitorForm'

// Actions
import {notify as notifyAction} from 'src/shared/actions/notifications'
import * as sourcesActions from 'src/shared/actions/sources'

// APIs
import {createKapacitor, updateKapacitor, pingKapacitor} from 'src/shared/apis'

// Constants
import {
  notifyKapacitorCreateFailed,
  notifyKapacitorSuccess,
  notifyKapacitorConnectionFailed,
  notifyKapacitorUpdated,
  notifyKapacitorUpdateFailed,
} from 'src/shared/copy/notifications'
import {DEFAULT_KAPACITOR} from 'src/shared/constants'

// Types
import {Kapacitor, Source} from 'src/types'

interface Props {
  notify: typeof notifyAction
  source: Source
  setError?: (b: boolean) => void
  sources: Source[]
  onBoarding?: boolean
  kapacitor: Kapacitor
  deleteKapacitor: sourcesActions.DeleteKapacitor
  setActiveKapacitor: sourcesActions.SetActiveKapacitor
  fetchKapacitors: sourcesActions.FetchKapacitorsAsync
  showNewKapacitor?: boolean
}

interface State {
  kapacitor: Kapacitor
}

const getActiveKapacitor = (source: Source, sources: Source[]): Kapacitor => {
  if (!source || !sources) {
    return null
  }
  const ActiveSource = sources.find(s => s.id === source.id)
  if (!ActiveSource || !ActiveSource.kapacitors) {
    return null
  }
  const activeKapacitor = ActiveSource.kapacitors.find(k => k.active)
  return activeKapacitor
}

@ErrorHandling
class KapacitorStep extends Component<Props, State> {
  public static defaultProps: Partial<Props> = {
    onBoarding: false,
  }

  constructor(props: Props) {
    super(props)

    const kapacitor = props.showNewKapacitor
      ? DEFAULT_KAPACITOR
      : getActiveKapacitor(props.source, props.sources)

    this.state = {
      kapacitor,
    }
  }

  public next = async () => {
    const {kapacitor} = this.state
    const {notify, source, setError} = this.props
    if (kapacitor.id) {
      if (this.existingKapacitorHasChanged) {
        try {
          const {data} = await updateKapacitor(kapacitor)
          await this.checkKapacitorConnection(data)
          setError(false)
          await this.fetchNewKapacitors()
          notify(notifyKapacitorUpdated())
          return {success: true, payload: data}
        } catch (error) {
          console.error(error)
          setError(true)
          notify(notifyKapacitorUpdateFailed())
          return {success: false, payload: null}
        }
      }
      return {success: true, payload: kapacitor}
    } else {
      try {
        const {data} = await createKapacitor(source, kapacitor)
        this.setState({kapacitor: data})
        await this.checkKapacitorConnection(data)
        setError(false)
        await this.fetchNewKapacitors()
        notify(notifyKapacitorSuccess())
        return {success: true, payload: data}
      } catch (error) {
        console.error(error)
        setError(true)
        notify(notifyKapacitorCreateFailed())
        return {success: false, payload: null}
      }
    }
  }

  public render() {
    const {setError, onBoarding} = this.props
    const {kapacitor} = this.state

    return (
      <>
        {!onBoarding && this.kapacitorDropdown}
        <KapacitorForm
          setError={setError}
          kapacitor={kapacitor}
          onChangeInput={this.onChangeInput}
        />
      </>
    )
  }

  private onChangeInput = (key: string) => (value: string | boolean) => {
    const {setError} = this.props
    const {kapacitor} = this.state

    this.setState({kapacitor: {...kapacitor, [key]: value}})

    setError(false)
  }

  private checkKapacitorConnection = async (kapacitor: Kapacitor) => {
    try {
      await pingKapacitor(kapacitor)
    } catch (error) {
      console.error(error)
      this.props.notify(notifyKapacitorConnectionFailed())
    }
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

    const activeKapacitor = getActiveKapacitor(source, sources)
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
  fetchKapacitors: sourcesActions.fetchKapacitorsAsync,
}

export default connect(mstp, mdtp, null, {withRef: true})(KapacitorStep)
