// Libraries
import React, {PureComponent, ReactNode} from 'react'

// Components
import FancyScrollbar from 'src/shared/components/FancyScrollbar'
import WizardButtonBar from 'src/reusable_ui/components/wizard/WizardButtonBar'

// Styles
import 'src/reusable_ui/components/wizard/WizardStep.scss'

import {ErrorHandling} from 'src/shared/decorators/errors'

interface Props {
  children: ReactNode
  title: string
  isComplete: () => boolean
  onPrevious?: () => void
  onNext?: () => void
  increment?: () => void
  decrement?: () => void
  tipText?: string
  nextLabel?: string
  previousLabel?: string
  lastStep?: boolean
}

@ErrorHandling
class WizardStep extends PureComponent<Props> {
  public render() {
    const {children, decrement, nextLabel, previousLabel, lastStep} = this.props

    return (
      <>
        <FancyScrollbar
          className="wizard-step-content"
          maxHeight={400}
          autoHeight={true}
          autoHide={false}
        >
          <div className="wizard-step-child">{children}</div>
        </FancyScrollbar>
        <WizardButtonBar
          decrement={decrement}
          nextLabel={nextLabel}
          previousLabel={previousLabel}
          onClickPrevious={this.handleClickPrevious}
          onClickNext={this.handleClickNext}
          lastStep={lastStep}
        />
      </>
    )
  }

  private handleClickPrevious = async () => {
    const {onPrevious, decrement} = this.props
    if (onPrevious) {
      await onPrevious()
    }
    if (decrement) {
      decrement()
    }
  }

  private handleClickNext = async () => {
    const {onNext, increment} = this.props
    if (onNext) {
      await onNext()
    }
    if (increment) {
      increment()
    }
  }
}

export default WizardStep
