import * as React from 'react'

import RedactedInput from './RedactedInput'
import {TagInput} from './OpsGenieConfigTags'

export interface OpsGenieOptions {
  teams: string[]
  recipients: string[]
}

export interface OpsGenieConfigProps {
  config: {
    options: OpsGenieOptions
  }
  onSave: (properties: OpsGenieOptions) => void
}

export interface OpsGenieConfigState {
  currentTeams: string[]
  currentRecipients: string[]
}

class OpsGenieConfig extends React.Component<
  OpsGenieConfigProps,
  OpsGenieConfigState
> {
  private apiKey

  constructor(props: OpsGenieConfigProps) {
    super(props)

    const {teams, recipients} = props.config.options

    this.state = {
      currentTeams: teams || [],
      currentRecipients: recipients || [],
    }
  }

  private handleSaveAlert = e => {
    e.preventDefault()

    const properties = {
      'api-key': this.apiKey.value,
      teams: this.state.currentTeams,
      recipients: this.state.currentRecipients,
    }

    this.props.onSave(properties)
  }

  private handleAddTeam = team => {
    this.setState({currentTeams: this.state.currentTeams.concat(team)})
  }

  private handleAddRecipient = recipient => {
    this.setState({
      currentRecipients: this.state.currentRecipients.concat(recipient),
    })
  }

  private handleDeleteTeam = team => () => {
    this.setState({
      currentTeams: this.state.currentTeams.filter(t => t !== team),
    })
  }

  private handleDeleteRecipient = recipient => () => {
    this.setState({
      currentRecipients: this.state.currentRecipients.filter(
        r => r !== recipient
      ),
    })
  }

  private handleApiKeyRef = r => (this.apiKey = r)

  public render() {
    const {options} = this.props.config
    const apiKey = options['api-key']
    const {currentTeams, currentRecipients} = this.state

    return (
      <form onSubmit={this.handleSaveAlert}>
        <div className="form-group col-xs-12">
          <label htmlFor="api-key">API Key</label>
          <RedactedInput
            defaultValue={apiKey}
            id="api-key"
            refFunc={this.handleApiKeyRef}
          />
          <label className="form-helper">
            Note: a value of <code>true</code> indicates the OpsGenie API key
            has been set
          </label>
        </div>

        <TagInput
          title="Teams"
          onAddTag={this.handleAddTeam}
          onDeleteTag={this.handleDeleteTeam}
          tags={currentTeams}
        />
        <TagInput
          title="Recipients"
          onAddTag={this.handleAddRecipient}
          onDeleteTag={this.handleDeleteRecipient}
          tags={currentRecipients}
        />

        <div className="form-group-submit col-xs-12 text-center">
          <button className="btn btn-primary" type="submit">
            Update OpsGenie Config
          </button>
        </div>
      </form>
    )
  }
}

export default OpsGenieConfig
