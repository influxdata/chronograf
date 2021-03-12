// Libraries
import React, {PureComponent} from 'react'
import {connect} from 'react-redux'

// Components
import {ErrorHandling} from 'src/shared/decorators/errors'

// Actions
import {notify as notifyAction} from 'src/shared/actions/notifications'

interface Props {
  notify: typeof notifyAction
}

@ErrorHandling
class SourceStep extends PureComponent<Props> {
  constructor(props: Props) {
    super(props)
  }

  public next = async () => {
    // navigate to newly created source?
  }

  public render() {
    return (
      <div className="wizard-step--bookend">
        <div className="auth-logo" />
        <h1>Welcome to Chronograf</h1>
        <p>Start using Chronograf in a few easy steps</p>
      </div>
    )
  }
}

const mdtp = {
  notify: notifyAction,
}

export default connect(null, mdtp, null, {forwardRef: true})(SourceStep)
