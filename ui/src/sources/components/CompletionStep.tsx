// Libraries
import React, {PureComponent} from 'react'
import {connect} from 'react-redux'

// Components
import {ErrorHandling} from 'src/shared/decorators/errors'

// Actions
import {notify as notifyAction} from 'src/shared/actions/notifications'

// Utils

// APIs

// Constants

// Types

interface Props {
  notify: typeof notifyAction
}

// interface State {}

@ErrorHandling
class SourceStep extends PureComponent<Props> {
  constructor(props: Props) {
    super(props)
  }

  public next = async () => {
    // navigate to newly created source?
  }

  public render() {
    return <>Congratulations! you are complete!</>
  }
}

const mdtp = {
  notify: notifyAction,
}

export default connect(null, mdtp, null, {withRef: true})(SourceStep)
