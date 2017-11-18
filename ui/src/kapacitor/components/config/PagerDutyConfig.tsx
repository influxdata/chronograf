import * as React from 'react'

export interface PagerDutyOptions {
  'service-key': string
  url: string
}

export interface PagerDutyConfigProps {
  config: {
    options: PagerDutyOptions
  }
  onSave: (properties: PagerDutyOptions) => void
}
class PagerDutyConfig extends React.Component<PagerDutyConfigProps> {
  private serviceKey
  private url

  private handleSaveAlert = e => {
    e.preventDefault()

    const properties = {
      'service-key': this.serviceKey.value,
      url: this.url.value,
    }

    this.props.onSave(properties)
  }

  public render() {
    const {options} = this.props.config
    const {url} = options
    const serviceKey = options['service-key']

    return (
      <form onSubmit={this.handleSaveAlert}>
        <div className="form-group col-xs-12">
          <label htmlFor="service-key">Service Key</label>
          <input
            className="form-control"
            id="service-key"
            type="text"
            ref={r => (this.serviceKey = r)}
            defaultValue={serviceKey || ''}
          />
          <label className="form-helper">
            Note: a value of <code>true</code> indicates the PagerDuty service
            key has been set
          </label>
        </div>

        <div className="form-group col-xs-12">
          <label htmlFor="url">PagerDuty URL</label>
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
            Update PagerDuty Config
          </button>
        </div>
      </form>
    )
  }
}

export default PagerDutyConfig
