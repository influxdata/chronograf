import React, {PureComponent, ReactNode} from 'react'

import 'src/reusable_ui/components/wizard/WizardStep.scss'

// import {} from 'src/types'

interface Props {
  children: ReactNode
  title: string
  isComplete: () => boolean
  onPrevious: () => void
  onNext: () => void
}

class WizardStep extends PureComponent<Props> {
  public render() {
    const {children, title, onPrevious, onNext} = this.props

    return (
      <div className="progress-step">
        <h2>{title}</h2>
        {children}
        <div className="button-bar">
          <button className="btn btn-md btn-default" onClick={onPrevious}>
            Alakazam
          </button>
          <button className="btn btn-md btn-primary" onClick={onNext}>
            Abrakabra
          </button>
        </div>
      </div>
    )
  }
}

export default WizardStep
