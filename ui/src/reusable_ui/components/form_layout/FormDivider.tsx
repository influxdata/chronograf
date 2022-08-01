// Libraries
import React, {Component} from 'react'

import {ErrorHandling} from 'src/shared/decorators/errors'

class FormDivider extends Component {
  public render() {
    return <label className="form---divider" />
  }
}

export default ErrorHandling(FormDivider)
