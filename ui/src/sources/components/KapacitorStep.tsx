import React, {PureComponent} from 'react'
import {connect} from 'react-redux'

import {ErrorHandling} from 'src/shared/decorators/errors'

import WizardTextInput from 'src/reusable_ui/components/wizard/WizardTextInput'
import WizardCheckbox from 'src/reusable_ui/components/wizard/WizardCheckbox'

import {notify as notifyAction} from 'src/shared/actions/notifications'
import {insecureSkipVerifyText} from 'src/shared/copy/tooltipText'

import {createKapacitor, pingKapacitor} from 'src/shared/apis'

import {
  notifyKapacitorCreateFailed,
  notifyKapacitorCreated,
  notifyKapacitorConnectionFailed,
} from 'src/shared/copy/notifications'

import {Kapacitor} from 'src/types'
import {DEFAULT_KAPACITOR} from 'src/shared/constants'
import {getDeep} from 'src/utils/wrappers'

interface Props {
  setCompletion: (isComplete: boolean) => void
  notify: typeof notifyAction
}

interface State {
  kapacitor: Kapacitor
  exists: boolean
}

@ErrorHandling
class SourceStep extends PureComponent<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      kapacitor: DEFAULT_KAPACITOR,
      exists: false,
    }
    // NEED SOURCE FROM PREV STEP, not current source!!!
    // and other kapacitors associated with source.
  }

  public next = async () => {
    const {kapacitor} = this.state
    const {notify} = this.props

    // const isNameTaken = kapacitors.some(k => k.name === kapacitor.name)
    // const isNew = !params.id

    // if (isNew && isNameTaken) {
    //   notify(notifyKapacitorNameAlreadyTaken)
    //   return
    // }

    try {
      const {data} = await createKapacitor(source, kapacitor)
      this.setState({kapacitor: data})
      this.checkKapacitorConnection(data)
      notify(notifyKapacitorCreated())
    } catch (error) {
      console.error(error)
      notify(notifyKapacitorCreateFailed())
    }
  }

  public render() {
    const {kapacitor} = this.state
    return (
      <>
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
    const {kapacitor} = this.state
    this.setState({kapacitor: {...kapacitor, [key]: value}})
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

  private get isHTTPS(): boolean {
    const {kapacitor} = this.state
    return getDeep<string>(kapacitor, 'url', '').startsWith('https')
  }
}

const mdtp = {
  notify: notifyAction,
}

export default connect(null, mdtp, null, {withRef: true})(SourceStep)
