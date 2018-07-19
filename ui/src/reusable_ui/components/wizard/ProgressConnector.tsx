import React, {PureComponent} from 'react'

import 'src/reusable_ui/components/wizard/ProgressConnector.scss'

enum statusStates {
  None = 'none',
  Some = 'some',
  Full = 'full',
}

interface Props {
  status: statusStates
}

class ProgressConnector extends PureComponent<Props> {
  public render() {
    const {status} = this.props

    return (
      <span
        className={`progress-connector progress-connector--${status || 'none'}`}
      />
    )
  }
}

export default ProgressConnector
