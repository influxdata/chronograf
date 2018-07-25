import React, {ChangeEvent, PureComponent} from 'react'

import Input from 'src/kapacitor/components/KapacitorFormInput'

import {NewService} from 'src/types'
import {FluxFormMode} from 'src/flux/constants/connection'

interface Props {
  service: NewService
  mode: FluxFormMode
  onSubmit: (e: ChangeEvent<HTMLFormElement>) => void
  onInputChange: (e: ChangeEvent<HTMLInputElement>) => void
}

class FluxForm extends PureComponent<Props> {
  public render() {
    const {service, onSubmit, onInputChange} = this.props

    return (
      <div className="template-variable-manager--body">
        <form onSubmit={onSubmit} style={{display: 'inline-block'}}>
          <Input
            name="url"
            label="Flux URL"
            value={this.url}
            placeholder={this.url}
            onChange={onInputChange}
            customClass="col-sm-6"
          />
          <Input
            name="name"
            label="Name"
            value={service.name}
            placeholder={service.name}
            onChange={onInputChange}
            maxLength={33}
            customClass="col-sm-6"
          />
          <div className="form-group form-group-submit col-xs-12 text-center">
            <button
              className="btn btn-success"
              type="submit"
              data-test="submit-button"
            >
              {this.buttonText}
            </button>
          </div>
        </form>
      </div>
    )
  }

  private get buttonText(): string {
    const {mode} = this.props

    if (mode === 'edit') {
      return 'Update'
    }

    return 'Connect'
  }

  private get url(): string {
    const {
      service: {url},
    } = this.props
    if (url) {
      return url
    }

    return ''
  }
}

export default FluxForm
