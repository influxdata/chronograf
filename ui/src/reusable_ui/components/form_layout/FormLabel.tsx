// Libraries
import React, {Component} from 'react'

import {ErrorHandling} from 'src/shared/decorators/errors'

interface Props {
  label: string
}

class FormLabel extends Component<Props> {
  public render() {
    const {label} = this.props

    return <label className="form--label">{label}</label>
  }
}

export default ErrorHandling(FormLabel)
