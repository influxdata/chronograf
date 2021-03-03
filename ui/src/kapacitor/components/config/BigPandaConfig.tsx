import _ from 'lodash'
import React, {PureComponent, ChangeEvent} from 'react'
import {ErrorHandling} from 'src/shared/decorators/errors'
import {BigPandaProperties} from 'src/types/kapacitor'
import RedactedInput from './RedactedInput'

interface Config {
  options: {
    url: string
    token: boolean
    'app-key': string
    'insecure-skip-verify': boolean
  }
}

interface Props {
  config: Config
  onSave: (properties: BigPandaProperties) => Promise<boolean>
  onTest: (event: React.MouseEvent<HTMLButtonElement>) => void
  enabled: boolean
}

interface State {
  testEnabled: boolean
  enabled: boolean
}

@ErrorHandling
class BigPandaConfig extends PureComponent<Props, State> {
  private url: HTMLInputElement
  private token: HTMLInputElement
  private appKey: HTMLInputElement
  private insecureSkipVerify: HTMLInputElement

  constructor(props) {
    super(props)
    this.state = {
      testEnabled: this.props.enabled,
      enabled: _.get(this.props, 'config.options.enabled', false),
    }
  }

  public render() {
    const {
      url,
      token,
      'app-key': appKey,
      'insecure-skip-verify': insecureSkipVerify,
    } = this.props.config.options
    const {testEnabled, enabled} = this.state

    return (
      <form onSubmit={this.handleSubmit}>
        <div className="form-group col-xs-12">
          <label htmlFor="source">URL</label>
          <input
            className="form-control"
            id="url"
            type="text"
            ref={r => (this.url = r)}
            defaultValue={url || 'https://api.bigpanda.io/data/v2/alerts'}
            onChange={this.disableTest}
          />
        </div>
        <div className="form-group col-xs-12">
          <label htmlFor="address">Token</label>
          <RedactedInput
            defaultValue={token}
            id="token"
            refFunc={this.handleTokenRef}
            disableTest={this.disableTest}
            isFormEditing={!testEnabled}
          />
        </div>
        <div className="form-group col-xs-12">
          <label htmlFor="source">Application Key</label>
          <input
            className="form-control"
            id="app-key"
            type="text"
            ref={r => (this.appKey = r)}
            placeholder="ex: My_Application_Key"
            defaultValue={appKey || ''}
            onChange={this.disableTest}
          />
        </div>

        <div className="form-group col-xs-12">
          <div className="form-control-static">
            <input
              id="insecureSkipVerify"
              type="checkbox"
              defaultChecked={insecureSkipVerify}
              ref={r => (this.insecureSkipVerify = r)}
              onChange={this.disableTest}
            />
            <label htmlFor="insecureSkipVerify">Insecure Skip Verify</label>
          </div>
        </div>

        <div className="form-group col-xs-12">
          <div className="form-control-static">
            <input
              type="checkbox"
              id="disabled"
              checked={enabled}
              onChange={this.handleEnabledChange}
            />
            <label htmlFor="disabled">Configuration Enabled</label>
          </div>
        </div>

        <div className="form-group form-group-submit col-xs-12 text-center">
          <button
            className="btn btn-primary"
            type="submit"
            disabled={this.state.testEnabled}
          >
            <span className="icon checkmark" />
            Save Changes
          </button>
          <button
            className="btn btn-primary"
            disabled={!this.state.testEnabled || !enabled}
            onClick={this.props.onTest}
          >
            <span className="icon pulse-c" />
            Send Test Event
          </button>
        </div>
      </form>
    )
  }

  private handleTokenRef = (r: HTMLInputElement) => (this.token = r)

  private handleEnabledChange = (e: ChangeEvent<HTMLInputElement>) => {
    this.setState({enabled: e.target.checked})
    this.disableTest()
  }

  private handleSubmit = async e => {
    e.preventDefault()

    const properties: BigPandaProperties = {
      url: this.url.value,
      token: this.token.value,
      'app-key': this.appKey.value,
      'insecure-skip-verify': this.insecureSkipVerify.checked,
      enabled: this.state.enabled,
    }

    const success = await this.props.onSave(properties)
    if (success) {
      this.setState({testEnabled: true})
    }
  }

  private disableTest = () => {
    this.setState({testEnabled: false})
  }
}

export default BigPandaConfig
