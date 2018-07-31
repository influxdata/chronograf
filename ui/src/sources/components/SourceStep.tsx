import React, {PureComponent} from 'react'
import {connect} from 'react-redux'

import {ErrorHandling} from 'src/shared/decorators/errors'
import {createSource, updateSource} from 'src/shared/apis'

import WizardTextInput from 'src/reusable_ui/components/wizard/WizardTextInput'
import {
  addSource as addSourceAction,
  AddSource,
} from 'src/shared/actions/sources'
import {Source} from 'src/types'

interface Props {}

interface State {
  source: object
}

@ErrorHandling
class SourceStep extends PureComponent<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      source: {
        url: '',
        name: '',
        username: '',
        password: '',
        telegraf: '',
        defaultRP: '',
      },
    }
  }
  public render() {
    const {handleInputChange} = this.props
    const {source} = this.state

    return (
      <>
        <WizardTextInput
          value={source.url}
          label="Connection URL"
          onChange={this.onChangeInput('url')}
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

  private onChangeInput = (key: string) => (value: string) => {
    const {source} = this.state
    this.setState({source: {...source, [key]: value}})
  }

  private next = () => {
    const {source} = this.state
    console.log('creating source', source)
    // const sourceFromServer = await createSource(source)
    // this.props.addSource(sourceFromServer)
    // console.log(source.name)
  }
}

const mdtp = {
  addSource: addSourceAction,
}

export default connect(null, mdtp, null, {withRef: true})(SourceStep)
// export default SourceStep
