import React, {PureComponent} from 'react'

import 'src/reusable_ui/components/wizard/WizardButtonBar.scss'

interface Props {
  decrement?: () => void
  nextLabel?: string
  previousLabel?: string
  lastStep?: boolean
  onClickPrevious: () => void
  onClickNext: () => void
}

class WizardButtonBar extends PureComponent<Props> {
  public static defaultProps: Partial<Props> = {
    nextLabel: 'next',
    previousLabel: 'previous',
  }

  public render() {
    const {
      decrement,
      previousLabel,
      nextLabel,
      onClickPrevious,
      onClickNext,
    } = this.props
    return (
      <div className="button-bar">
        {decrement && (
          <button className="btn btn-md btn-default" onClick={onClickPrevious}>
            {previousLabel}
          </button>
        )}
        <button
          className={`btn btn-md ${this.buttonColor}`}
          onClick={onClickNext}
        >
          {nextLabel || 'next'}
        </button>
      </div>
    )
  }

  private get buttonColor() {
    const {lastStep} = this.props

    if (lastStep) {
      return 'btn-success'
    }

    return 'btn-primary'
  }
}

export default WizardButtonBar
