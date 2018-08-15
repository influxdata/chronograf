// Libraries
import React, {PureComponent} from 'react'
import {connect} from 'react-redux'
import _ from 'lodash'

// Components
import {ErrorHandling} from 'src/shared/decorators/errors'
import WizardTextInput from 'src/reusable_ui/components/wizard/WizardTextInput'
import WizardCheckbox from 'src/reusable_ui/components/wizard/WizardCheckbox'

// Actions
import {
  addSource as addSourceAction,
  updateSource as updateSourceAction,
} from 'src/shared/actions/sources'
import {notify as notifyAction} from 'src/shared/actions/notifications'

// Utils
import {getDeep} from 'src/utils/wrappers'

// APIs
import {createSource, updateSource} from 'src/shared/apis'

// Constants
import {
  notifySourceUdpated,
  notifySourceUdpateFailed,
  notifySourceCreationFailed,
  notifySourceCreationSucceeded,
} from 'src/shared/copy/notifications'
import {insecureSkipVerifyText} from 'src/shared/copy/tooltipText'
import {DEFAULT_SOURCE} from 'src/shared/constants'
import {SUPERADMIN_ROLE} from 'src/auth/Authorized'

// Types
import {Source, Me} from 'src/types'

interface Props {
  notify: typeof notifyAction
  addSource: typeof addSourceAction
  updateSource: typeof updateSourceAction
  setError?: (b: boolean) => void
  source: Source
  onBoarding?: boolean
  me: Me
  isUsingAuth: boolean
}

interface State {
  source: Partial<Source>
}

@ErrorHandling
class SourceStep extends PureComponent<Props, State> {
  public static defaultProps: Partial<Props> = {
    onBoarding: false,
  }
  constructor(props: Props) {
    super(props)
    this.state = {
      source: this.props.source || DEFAULT_SOURCE,
    }
  }

  public next = async () => {
    const {source} = this.state
    const {notify, setError} = this.props

    if (this.isNewSource) {
      try {
        const sourceFromServer = await createSource(source)
        this.props.addSource(sourceFromServer)
        notify(notifySourceCreationSucceeded(source.name))
        setError(false)
        return {success: true, payload: sourceFromServer}
      } catch (err) {
        notify(notifySourceCreationFailed(source.name, this.parseError(err)))
        setError(true)
        return {success: false, payload: null}
      }
    } else {
      if (this.sourceIsEdited) {
        try {
          const sourceFromServer = await updateSource(source)
          this.props.updateSource(sourceFromServer)
          notify(notifySourceUdpated(source.name))
          setError(false)
          return {success: true, payload: sourceFromServer}
        } catch (error) {
          notify(notifySourceUdpateFailed(source.name, this.parseError(error)))
          setError(true)
          return {success: false, payload: null}
        }
      }
      return {success: true, payload: source}
    }
  }

  public render() {
    const {source} = this.state
    const {isUsingAuth, onBoarding} = this.props
    return (
      <>
        {isUsingAuth && onBoarding && this.authIndicator}
        <WizardTextInput
          value={source.url}
          label="Connection URL"
          onChange={this.onChangeInput('url')}
          valueModifier={this.URLModifier}
        />
        <WizardTextInput
          value={source.name}
          label="Connection Name"
          onChange={this.onChangeInput('name')}
        />
        <WizardTextInput
          value={source.username}
          label="Username"
          onChange={this.onChangeInput('username')}
        />
        <WizardTextInput
          value={source.password}
          label="Password"
          placeholder={this.passwordPlaceholder}
          type="password"
          onChange={this.onChangeInput('password')}
        />
        <WizardTextInput
          value={source.telegraf}
          label="Telegraf Database Name"
          onChange={this.onChangeInput('telegraf')}
        />
        <WizardTextInput
          value={source.defaultRP}
          label="Default Retention Policy"
          onChange={this.onChangeInput('defaultRP')}
        />
        {this.isEnterprise && (
          <WizardTextInput
            value={source.metaUrl}
            label="Meta Service Connection URL"
            onChange={this.onChangeInput('metaUrl')}
          />
        )}
        {!onBoarding && (
          <WizardCheckbox
            isChecked={source.default}
            text={'Make this the default connection'}
            onChange={this.onChangeInput('default')}
          />
        )}
        {this.isHTTPS && (
          <WizardCheckbox
            isChecked={source.insecureSkipVerify}
            text={`Unsafe SSL`}
            onChange={this.onChangeInput('insecureSkipVerify')}
            subtext={insecureSkipVerifyText}
          />
        )}
      </>
    )
  }

  private get passwordPlaceholder() {
    const {source} = this.props
    if (source && source.authentication === 'basic') {
      return 'Value saved in server'
    }
  }

  private get authIndicator(): JSX.Element {
    const {me} = this.props
    return (
      <div className="text-center">
        {me.role === SUPERADMIN_ROLE ? (
          <h4>
            <strong>{me.currentOrganization.name}</strong> currently has no
            connections
          </h4>
        ) : (
          <h3>
            <strong>{me.currentOrganization.name}</strong> has no connections
            available to <em>{me.role}s</em>
          </h3>
        )}
      </div>
    )
  }

  private URLModifier = (value: string): string => {
    const url = value.trim()
    if (url.startsWith('http')) {
      return url
    }
    return `http://${url}`
  }

  private parseError = (error): string => {
    return getDeep<string>(error, 'data.message', error)
  }

  private onChangeInput = (key: string) => (value: string | boolean) => {
    const {source} = this.state
    const {setError} = this.props
    this.setState({source: {...source, [key]: value}})
    setError(false)
  }

  private get isNewSource(): boolean {
    return _.isNull(this.props.source)
  }

  private get sourceIsEdited(): boolean {
    const sourceInProps = this.props.source
    const sourceInState = this.state.source
    return !_.isEqual(sourceInProps, sourceInState)
  }

  private get isHTTPS(): boolean {
    const {source} = this.state
    return getDeep<string>(source, 'url', '').startsWith('https')
  }

  private get isEnterprise(): boolean {
    const {source} = this.props
    return _.get(source, 'type', '').includes('enterprise')
  }
}

const mdtp = {
  notify: notifyAction,
  addSource: addSourceAction,
  updateSource: updateSourceAction,
}

export default connect(null, mdtp, null, {withRef: true})(SourceStep)
