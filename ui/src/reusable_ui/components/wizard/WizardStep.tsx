import React, {PureComponent, ReactNode} from 'react'

import 'src/reusable_ui/components/wizard/WizardStep.scss'

interface Props {
  children: ReactNode
  title: string
  isComplete: () => boolean
  onPrevious: () => void
  onNext: () => void
  increment?: () => void
  decrement?: () => void
}

class WizardStep extends PureComponent<Props> {
  public render() {
    const {children, title, decrement} = this.props

    return (
      <div className="progress-step">
        <h2>{title}</h2>
        {children}
        <div className="button-bar">
          {decrement && (
            <button
              className="btn btn-md btn-default"
              onClick={this.handleClickPrevious}
            >
              Alakazam
            </button>
          )}
          <button
            className="btn btn-md btn-primary"
            onClick={this.handleClickNext}
          >
            Abrakabra
          </button>
        </div>
      </div>
    )
  }

  private handleClickPrevious = () => {
    const {onPrevious, decrement} = this.props
    onPrevious() // TODO wait if async function
    decrement()
  }

  private handleClickNext = () => {
    const {onNext, increment} = this.props
    onNext()
    increment()
  }
}

export default WizardStep
