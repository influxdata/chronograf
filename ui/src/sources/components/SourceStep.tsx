// Libraries
import React, {PureComponent} from 'react'
import {connect} from 'react-redux'

// Components
import {ErrorHandling} from 'src/shared/decorators/errors'
import WizardTextInput from 'src/reusable_ui/components/wizard/WizardTextInput'
import WizardCheckbox from 'src/reusable_ui/components/wizard/WizardCheckbox'

// Actions
import {addSource as addSourceAction} from 'src/shared/actions/sources'
import {notify as notifyAction} from 'src/shared/actions/notifications'

// Utils
import {getDeep} from 'src/utils/wrappers'

// APIs
import {createSource} from 'src/shared/apis'

// Constants
import {
  notifySourceCreationFailed,
  notifySourceCreationSucceeded,
} from 'src/shared/copy/notifications'
import {insecureSkipVerifyText} from 'src/shared/copy/tooltipText'
import {DEFAULT_SOURCE} from 'src/shared/constants'

// Types
import {Source} from 'src/types'

interface Props {
  notify: typeof notifyAction
  addSource: typeof addSourceAction
  source: Source
}

interface State {
  source: Partial<Source>
}

@ErrorHandling
class SourceStep extends PureComponent<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      source: this.props.source || DEFAULT_SOURCE,
    }
  }

  public next = async () => {
    const {source} = this.state
    const {notify} = this.props
    try {
      const sourceFromServer = await createSource(source)
      this.props.addSource(sourceFromServer)
      notify(notifySourceCreationSucceeded(source.name))
      return sourceFromServer
    } catch (err) {
      notify(notifySourceCreationFailed(source.name, this.parseError(err)))
    }
  }

  public render() {
    const {source} = this.state
    return (
      <>
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
        <WizardCheckbox
          isChecked={source.default}
          text={'Make this the default connection'}
          onChange={this.onChangeInput('default')}
        />
        {this.isHTTPS && (
          <WizardCheckbox
            isChecked={source.insecureSkipVerify}
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

  private parseError = (error): string => {
    return getDeep<string>(error, 'data.message', error)
  }

  private onChangeInput = (key: string) => (value: string | boolean) => {
    const {source} = this.state
    this.setState({source: {...source, [key]: value}})
  }

  private get isHTTPS(): boolean {
    const {source} = this.state
    return getDeep<string>(source, 'url', '').startsWith('https')
  }
}

const mdtp = {
  notify: notifyAction,
  addSource: addSourceAction,
}

export default connect(null, mdtp, null, {withRef: true})(SourceStep)
