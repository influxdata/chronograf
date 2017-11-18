import * as React from 'react'

import RedactedInput from './RedactedInput'

export interface VictorOpsOptions {
  'api-key': boolean
  'routing-key': string
  url: string
}

export interface VictorOpsConfigProps {
  config: {
    options: VictorOpsOptions
  }
  onSave: (properties: VictorOpsOptions) => void
}

class VictorOpsConfig extends React.Component<VictorOpsConfigProps> {
  private apiKey
  private routingKey
  private url

  private handleSaveAlert = e => {
    e.preventDefault()

    const properties = {
      'api-key': this.apiKey.value,
      'routing-key': this.routingKey.value,
      url: this.url.value,
    }

    this.props.onSave(properties)
  }

  private handleApiRef = r => (this.apiKey = r)

  public render() {
    const {options} = this.props.config
    const apiKey = options['api-key']
    const routingKey = options['routing-key']
    const {url} = options

    return (
      <form onSubmit={this.handleSaveAlert}>
        <div className="form-group col-xs-12">
          <label htmlFor="api-key">API Key</label>
          <RedactedInput
            defaultValue={apiKey}
            id="api-key"
            refFunc={this.handleApiRef}
          />
        </div>

        <div className="form-group col-xs-12">
          <label htmlFor="routing-key">Routing Key</label>
          <input
            className="form-control"
            id="routing-key"
            type="text"
            ref={r => (this.routingKey = r)}
            defaultValue={routingKey || ''}
          />
        </div>

        <div className="form-group col-xs-12">
          <label htmlFor="url">VictorOps URL</label>
          <input
            className="form-control"
            id="url"
            type="text"
            ref={r => (this.url = r)}
            defaultValue={url || ''}
          />
        </div>

        <div className="form-group-submit col-xs-12 text-center">
          <button className="btn btn-primary" type="submit">
            Update VictorOps Config
          </button>
        </div>
      </form>
    )
  }
}

export default VictorOpsConfig
