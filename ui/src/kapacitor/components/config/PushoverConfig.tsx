import * as React from 'react'

import QuestionMarkTooltip from 'shared/components/QuestionMarkTooltip'
import RedactedInput from './RedactedInput'

import {PUSHOVER_DOCS_LINK} from 'kapacitor/copy'

export interface PushoverOptions {
  token: string
  url: string
  'user-key': string
}

export interface PushoverConfigProps {
  config: {
    options: PushoverOptions
  }
  onSave: (properties: PushoverOptions) => void
}

class PushoverConfig extends React.Component<PushoverConfigProps> {
  private token
  private url
  private userKey

  private handleSaveAlert = e => {
    e.preventDefault()

    const properties = {
      token: this.token.value,
      url: this.url.value,
      'user-key': this.userKey.value,
    }

    this.props.onSave(properties)
  }

  private handleUserKeyRef = r => (this.userKey = r)

  private handleTokenRef = r => (this.token = r)

  public render() {
    const {options} = this.props.config
    const {token, url} = options
    const userKey = options['user-key']

    return (
      <form onSubmit={this.handleSaveAlert}>
        <div className="form-group col-xs-12">
          <label htmlFor="user-key">
            User Key
            <QuestionMarkTooltip
              tipID="token"
              tipContent={PUSHOVER_DOCS_LINK}
            />
          </label>
          <RedactedInput
            defaultValue={userKey}
            id="user-key"
            refFunc={this.handleUserKeyRef}
          />
        </div>

        <div className="form-group col-xs-12">
          <label htmlFor="token">
            Token
            <QuestionMarkTooltip
              tipID="token"
              tipContent={PUSHOVER_DOCS_LINK}
            />
          </label>
          <RedactedInput
            defaultValue={token}
            id="token"
            refFunc={this.handleTokenRef}
          />
        </div>

        <div className="form-group col-xs-12">
          <label htmlFor="url">Pushover URL</label>
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
            Update Pushover Config
          </button>
        </div>
      </form>
    )
  }
}

export default PushoverConfig
