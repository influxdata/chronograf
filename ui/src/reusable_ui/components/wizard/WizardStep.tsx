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
  tipText?: string
  nextLabel?: string
  previousLabel?: string
  lastStep?: boolean
}

class WizardStep extends PureComponent<Props> {
  public render() {
    const {children, decrement, tipText, nextLabel, previousLabel} = this.props

    return (
      <div className="progress-step">
        <div className="tip-text">
          <p>{tipText}</p>
        </div>
        <div className="step-content">{children}</div>
        <div className="button-bar">
          {decrement && (
            <button
              className="btn btn-md btn-default"
              onClick={this.handleClickPrevious}
            >
              {previousLabel || 'back'}
            </button>
          )}
          <button
            className={`btn btn-md ${this.buttonColor}`}
            onClick={this.handleClickNext}
          >
            {nextLabel || 'next'}
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

  private get buttonColor() {
    const {lastStep} = this.props

    if (lastStep) {
      return 'btn-success'
    }

    return 'btn-primary'
  }
}

export default WizardStep
