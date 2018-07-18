import React, {PureComponent, ReactNode} from 'react'

// import {} from 'src/types'

interface Props {
  children: ReactNode
}

class WizardFullScreen extends PureComponent<Props> {
  public render() {
    const {children} = this.props

    return <div className="progress-bar">Step: {children}</div>
  }
}

export default WizardFullScreen
