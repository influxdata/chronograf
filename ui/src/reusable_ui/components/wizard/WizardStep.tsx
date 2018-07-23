import React, {PureComponent, ReactNode} from 'react'
import FancyScrollbar from 'src/shared/components/FancyScrollbar'

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
    const {children, decrement, nextLabel, previousLabel} = this.props

    return (
      <>
        <FancyScrollbar
          className="step-content"
          maxHeight={400}
          autoHeight={true}
        >
          {children}
        </FancyScrollbar>
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
      </>
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
