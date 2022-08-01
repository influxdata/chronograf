// Libraries
import React, {Component} from 'react'

import {ErrorHandling} from 'src/shared/decorators/errors'

interface Props {
  children: JSX.Element[]
}

class PanelFooter extends Component<Props> {
  public render() {
    const {children} = this.props

    return <div className="panel-footer">{children}</div>
  }
}

export default ErrorHandling(PanelFooter)
