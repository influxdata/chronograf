import _ from 'lodash'
import React, {PureComponent, ChangeEvent} from 'react'
import {ErrorHandling} from 'src/shared/decorators/errors'
import {ServiceNowProperties} from 'src/types/kapacitor'
import RedactedInput from './RedactedInput'

interface Config {
  options: {
    url: string
    source: string
    username: string
    password: boolean
    enabled: boolean
  }
}

interface Props {
  config: Config
  onSave: (properties: ServiceNowProperties) => Promise<boolean>
  onTest: (event: React.MouseEvent<HTMLButtonElement>) => void
  enabled: boolean
}

interface State {
  testEnabled: boolean
  enabled: boolean
}

@ErrorHandling
class ServiceNowConfig extends PureComponent<Props, State> {
  private url: HTMLInputElement
  private source: HTMLInputElement
  private username: HTMLInputElement
  private password: HTMLInputElement

  constructor(props) {
    super(props)
    this.state = {
      testEnabled: this.props.enabled,
      enabled: _.get(this.props, 'config.options.enabled', false),
    }
  }

  public render() {
    const {source, url, username, password} = this.props.config.options
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
            defaultValue={url || ''}
            onChange={this.disableTest}
          />
        </div>
        <div className="form-group col-xs-12">
          <label htmlFor="source">Source</label>
          <input
            className="form-control"
            id="source"
            type="text"
            ref={r => (this.source = r)}
            defaultValue={source || ''}
            onChange={this.disableTest}
          />
        </div>

        <div className="form-group col-xs-12 col-md-6">
          <label htmlFor="address">Username</label>
          <input
            className="form-control"
            id="username"
            type="text"
            ref={r => (this.username = r)}
            defaultValue={username || ''}
            onChange={this.disableTest}
          />
        </div>
        <div className="form-group col-xs-12 col-md-6">
          <label htmlFor="address">Password</label>
          <RedactedInput
            defaultValue={password}
            id="password"
            refFunc={this.handlePasswordRef}
            disableTest={this.disableTest}
            isFormEditing={!testEnabled}
          />
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

  private handlePasswordRef = (r: HTMLInputElement) => (this.password = r)

  private handleEnabledChange = (e: ChangeEvent<HTMLInputElement>) => {
    this.setState({enabled: e.target.checked})
    this.disableTest()
  }

  private handleSubmit = async e => {
    e.preventDefault()

    const properties: ServiceNowProperties = {
      url: this.url.value,
      source: this.source.value,
      username: this.username.value,
      password: this.password.value,
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

export default ServiceNowConfig
