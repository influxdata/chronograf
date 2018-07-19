import React, {PureComponent, ReactNode} from 'react'

// import {} from 'src/types'

interface Props {
  children: ReactNode
  title: string
  isComplete: () => boolean
}

class WizardStep extends PureComponent<Props> {
  public render() {
    const {children, title} = this.props

    return (
      <div className="progress-step">
        <h2>{title}</h2>
        {children}
      </div>
    )
  }
}

export default WizardStep
