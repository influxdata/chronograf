import React, {PureComponent} from 'react'
import {connect} from 'react-redux'

import {ErrorHandling} from 'src/shared/decorators/errors'
import {createSource} from 'src/shared/apis'

import WizardTextInput from 'src/reusable_ui/components/wizard/WizardTextInput'
import {addSource as addSourceAction} from 'src/shared/actions/sources'
import {notify as notifyAction} from 'src/shared/actions/notifications'

import {
  notifySourceCreationFailed,
  notifySourceCreationSucceeded,
} from 'src/shared/copy/notifications'

import {Source} from 'src/types'
import {DEFAULT_SOURCE} from 'src/shared/constants'
import {getDeep} from 'src/utils/wrappers'

interface Props {
  setCompletion: (isComplete: boolean) => void
  notify: typeof notifyAction
  addSource: typeof addSourceAction
}

interface State {
  source: Partial<Source>
}

@ErrorHandling
class SourceStep extends PureComponent<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      source: DEFAULT_SOURCE,
    }
  }

  public next = async () => {
    const {source} = this.state
    const {notify} = this.props
    try {
      const sourceFromServer = await createSource(source)
      this.props.addSource(sourceFromServer)
      notify(notifySourceCreationSucceeded(source.name))
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

  private onChangeInput = (key: string) => (value: string) => {
    const {source} = this.state
    this.setState({source: {...source, [key]: value}})
  }
}

const mdtp = {
  notify: notifyAction,
  addSource: addSourceAction,
}

export default connect(null, mdtp, null, {withRef: true})(SourceStep)
