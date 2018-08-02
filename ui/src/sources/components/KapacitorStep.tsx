// Libraries
import React, {PureComponent} from 'react'
import {connect} from 'react-redux'

// Components
import {ErrorHandling} from 'src/shared/decorators/errors'
import WizardTextInput from 'src/reusable_ui/components/wizard/WizardTextInput'
import WizardCheckbox from 'src/reusable_ui/components/wizard/WizardCheckbox'

// Actions
import {notify as notifyAction} from 'src/shared/actions/notifications'

// Utils
import {getDeep} from 'src/utils/wrappers'

// APIs
import {createKapacitor, pingKapacitor} from 'src/shared/apis'

// Constants
import {insecureSkipVerifyText} from 'src/shared/copy/tooltipText'
import {
  notifyKapacitorCreateFailed,
  notifyKapacitorCreated,
  notifyKapacitorConnectionFailed,
} from 'src/shared/copy/notifications'
import {DEFAULT_KAPACITOR} from 'src/shared/constants'

// Types
import {Kapacitor, Source} from 'src/types'

interface Props {
  notify: typeof notifyAction
  source: Source
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
  }

  public next = async () => {
    const {kapacitor} = this.state
    const {notify, source} = this.props

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
