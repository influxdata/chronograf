// Libraries
import React, {PureComponent} from 'react'
import {connect} from 'react-redux'

// Components
import {ErrorHandling} from 'src/shared/decorators/errors'
import WizardTextInput from 'src/reusable_ui/components/wizard/WizardTextInput'
import WizardCheckbox from 'src/reusable_ui/components/wizard/WizardCheckbox'
import KapacitorDropdown from 'src/sources/components/KapacitorDropdown'

// Actions
import {notify as notifyAction} from 'src/shared/actions/notifications'
import * as sourcesActions from 'src/shared/actions/sources'

// Utils
import {getDeep} from 'src/utils/wrappers'

// APIs
import {createKapacitor, pingKapacitor} from 'src/shared/apis'

// Constants
import {insecureSkipVerifyText} from 'src/shared/copy/tooltipText'
import {
  notifyKapacitorCreateFailed,
  notifyKapacitorSuccess,
  notifyKapacitorConnectionFailed,
} from 'src/shared/copy/notifications'
import {DEFAULT_KAPACITOR} from 'src/shared/constants'

// Types
import {Kapacitor, Source} from 'src/types'
import {KapacitorItem} from 'src/sources/components/KapacitorDropdown'

interface Props {
  notify: typeof notifyAction
  source: Source
  setError?: (b: boolean) => void
  sources: Source[]
  deleteKapacitor: sourcesActions.DeleteKapacitor
  setActiveKapacitor: sourcesActions.SetActiveKapacitor
}

interface State {
  kapacitor: Kapacitor
  exists: boolean
}

@ErrorHandling
class KapacitorStep extends PureComponent<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      kapacitor: DEFAULT_KAPACITOR,
      exists: false,
    }
  }

  public next = async () => {
    const {kapacitor} = this.state
    const {notify, source, setError} = this.props

    try {
      const {data} = await createKapacitor(source, kapacitor)
      this.setState({kapacitor: data})
      this.checkKapacitorConnection(data)
      notify(notifyKapacitorSuccess())
      setError(false)
      return {status: true, payload: data}
    } catch (error) {
      console.error(error)
      notify(notifyKapacitorCreateFailed())
      setError(true)
      return {status: false, payload: null}
    }
  }

  public render() {
    const {kapacitor} = this.state
    return (
      <>
        {this.kapacitorDropdown}
        <WizardTextInput
          value={kapacitor.url}
          label="Kapacitor URL"
          onChange={this.onChangeInput('url')}
          valueModifier={this.URLModifier}
        />
        <WizardTextInput
          value={kapacitor.name}
          label="Name"
          onChange={this.onChangeInput('name')}
        />
        <WizardTextInput
          value={kapacitor.username}
          label="Username"
          onChange={this.onChangeInput('username')}
        />
        <WizardTextInput
          value={kapacitor.password}
          label="Password"
          onChange={this.onChangeInput('password')}
        />
        {this.isHTTPS && (
          <WizardCheckbox
            isChecked={kapacitor.insecureSkipVerify}
            text={`Unsafe SSL: ${insecureSkipVerifyText}`}
            onChange={this.onChangeInput('insecureSkipVerify')}
          />
        )}
      </>
    )
  }

  private URLModifier = (value: string): string => {
    const url = value.trim()
    if (url.startsWith('http')) {
      return url
    }
    return `http://${url}`
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
      this.setState({exists: true})
    } catch (error) {
      console.error(error)
      this.setState({exists: false})
      this.props.notify(notifyKapacitorConnectionFailed())
    }
  }

  private handleSetActiveKapacitor = (item: KapacitorItem) => {
    this.props.setActiveKapacitor(item.kapacitor)
  }

  private get isHTTPS(): boolean {
    const {kapacitor} = this.state
    return getDeep<string>(kapacitor, 'url', '').startsWith('https')
  }

  private get kapacitorDropdown() {
    const {source, sources, deleteKapacitor} = this.props

    if (source && sources) {
      const storeSource = sources.filter(s => s.id === source.id)[0]
      return (
        <div className="form-group col-xs-12 wizard-input">
          <KapacitorDropdown
            suppressEdit={true}
            source={storeSource}
            kapacitors={storeSource.kapacitors}
            deleteKapacitor={deleteKapacitor}
            setActiveKapacitor={this.handleSetActiveKapacitor}
            buttonSize="btn-sm"
          />
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
}

export default connect(mstp, mdtp, null, {withRef: true})(KapacitorStep)
