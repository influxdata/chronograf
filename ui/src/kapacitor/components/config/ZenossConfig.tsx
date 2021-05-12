import _ from 'lodash'
import React, {PureComponent, ChangeEvent} from 'react'
import {ErrorHandling} from 'src/shared/decorators/errors'
import {ZenossProperties} from 'src/types/kapacitor'
import RedactedInput from './RedactedInput'

interface Config {
  options: {
    url: string
    username: string
    password: boolean
    action: string
    method: string
    type: string
    tid: number
    'severity-map': {
      ok: string
      info: string
      warning: string
      critical: string
    }
    enabled: boolean
  }
}

interface Props {
  config: Config
  onSave: (properties: ZenossProperties) => Promise<boolean>
  onTest: (event: React.MouseEvent<HTMLButtonElement>) => void
  enabled: boolean
}

interface State {
  testEnabled: boolean
  enabled: boolean
}

@ErrorHandling
class ZenossConfig extends PureComponent<Props, State> {
  private url: HTMLInputElement
  private username: HTMLInputElement
  private password: HTMLInputElement
  private action: HTMLInputElement
  private method: HTMLInputElement
  private type: HTMLInputElement
  private tid: HTMLInputElement
  private ok: HTMLInputElement
  private info: HTMLInputElement
  private warning: HTMLInputElement
  private critical: HTMLInputElement

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
      username,
      password,
      action,
      method,
      type,
      tid,
      'severity-map': {ok, info, warning, critical},
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
            defaultValue={url || ''}
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
          <label htmlFor="source">Action (router name)</label>
          <input
            className="form-control"
            id="action"
            type="text"
            ref={r => (this.action = r)}
            defaultValue={action || ''}
            onChange={this.disableTest}
          />
        </div>
        <div className="form-group col-xs-12">
          <label htmlFor="source">Router method</label>
          <input
            className="form-control"
            id="method"
            type="text"
            ref={r => (this.method = r)}
            defaultValue={method || ''}
            onChange={this.disableTest}
          />
        </div>
        <div className="form-group col-xs-12">
          <label htmlFor="source">Event Type</label>
          <input
            className="form-control"
            id="method"
            type="text"
            ref={r => (this.type = r)}
            defaultValue={type || ''}
            onChange={this.disableTest}
          />
        </div>
        <div className="form-group col-xs-12">
          <label htmlFor="source">Event TID</label>
          <input
            className="form-control"
            id="tid"
            type="number"
            ref={r => (this.tid = r)}
            defaultValue={tid || ''}
            onChange={this.disableTest}
          />
        </div>
        <div className="form-group col-xs-12">
          <label>Kapacitor to Zenoss Severity Mapping</label>
          <div className="form-control-static">
            <div className="form-group col-xs-12 col-md-6 col-lg-3">
              <label htmlFor="source">OK</label>
              <input
                className="form-control"
                id="okSeverity"
                type="text"
                ref={r => (this.ok = r)}
                defaultValue={ok || ''}
                onChange={this.disableTest}
              />
            </div>
            <div className="form-group col-xs-12 col-md-6 col-lg-3">
              <label htmlFor="source">Info</label>
              <input
                className="form-control"
                id="infoSeverity"
                type="text"
                ref={r => (this.info = r)}
                defaultValue={info || ''}
                onChange={this.disableTest}
              />
            </div>
            <div className="form-group col-xs-12 col-md-6 col-lg-3">
              <label htmlFor="source">Warning</label>
              <input
                className="form-control"
                id="warningSeverity"
                type="text"
                ref={r => (this.warning = r)}
                defaultValue={warning || ''}
                onChange={this.disableTest}
              />
            </div>
            <div className="form-group col-xs-12 col-md-6 col-lg-3">
              <label htmlFor="source">Critical</label>
              <input
                className="form-control"
                id="criticalSeverity"
                type="text"
                ref={r => (this.critical = r)}
                defaultValue={critical || ''}
                onChange={this.disableTest}
              />
            </div>
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

  private handlePasswordRef = (r: HTMLInputElement) => (this.password = r)

  private handleEnabledChange = (e: ChangeEvent<HTMLInputElement>) => {
    this.setState({enabled: e.target.checked})
    this.disableTest()
  }

  private handleSubmit = async e => {
    e.preventDefault()
    let tid: number
    try {
      tid = parseInt(this.tid.value, 10)
    } catch (nfe) {
      console.error(nfe)
      tid = 1
    }

    const properties: ZenossProperties = {
      url: this.url.value,
      username: this.username.value,
      password: this.password.value,
      action: this.action.value,
      method: this.method.value,
      type: this.type.value,
      tid,
      'severity-map': {
        ok: this.ok.value,
        info: this.info.value,
        warning: this.warning.value,
        critical: this.critical.value,
      },
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

export default ZenossConfig
