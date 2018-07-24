import React, {PureComponent} from 'react'
import {ConnectorState} from 'src/types/wizard'
import {ErrorHandling} from 'src/shared/decorators/errors'

import 'src/reusable_ui/components/wizard/ProgressConnector.scss'

interface Props {
  status: ConnectorState
}

@ErrorHandling
class ProgressConnector extends PureComponent<Props> {
  public render() {
    const {status} = this.props

    return (
      <span
        className={`progress-connector progress-connector--${status ||
          ConnectorState.None}`}
      />
    )
  }
}

export default ProgressConnector
