import * as React from 'react'

import QuestionMarkTooltip from 'shared/components/QuestionMarkTooltip'
import {HIPCHAT_TOKEN_TIP} from 'kapacitor/copy'
import RedactedInput from './RedactedInput'

export interface HipchatOptions {
  room: string
  token: boolean
  url: string
}

export interface HipchatConfigProps {
  config: {
    options: HipchatOptions
  }
  onSave: (properties: HipchatOptions) => void
}

class HipchatConfig extends React.Component<HipchatConfigProps> {
  private room
  private token
  private url

  private handleSaveAlert = e => {
    e.preventDefault()

    const properties = {
      room: this.room.value,
      url: `https://${this.url.value}.hipchat.com/v2/room`,
      token: this.token.value,
    }

    this.props.onSave(properties)
  }

  private handleTokenRef = r => (this.token = r)

  public render() {
    const {options} = this.props.config
    const {url, room, token} = options

    const subdomain = url
      .replace('https://', '')
      .replace('.hipchat.com/v2/room', '')

    return (
      <form onSubmit={this.handleSaveAlert}>
        <div className="form-group col-xs-12">
          <label htmlFor="url">Subdomain</label>
          <input
            className="form-control"
            id="url"
            type="text"
            placeholder="your-subdomain"
            ref={r => (this.url = r)}
            defaultValue={subdomain && subdomain.length ? subdomain : ''}
          />
        </div>

        <div className="form-group col-xs-12">
          <label htmlFor="room">Room</label>
          <input
            className="form-control"
            id="room"
            type="text"
            placeholder="your-hipchat-room"
            ref={r => (this.room = r)}
            defaultValue={room || ''}
          />
        </div>

        <div className="form-group col-xs-12">
          <label htmlFor="token">
            Token
            <QuestionMarkTooltip tipID="token" tipContent={HIPCHAT_TOKEN_TIP} />
          </label>
          <RedactedInput
            defaultValue={token}
            id="token"
            refFunc={this.handleTokenRef}
          />
        </div>

        <div className="form-group-submit col-xs-12 text-center">
          <button className="btn btn-primary" type="submit">
            Update HipChat Config
          </button>
        </div>
      </form>
    )
  }
}

export default HipchatConfig
