import React, {PureComponent} from 'react'
import {ErrorHandling} from 'src/shared/decorators/errors'
import SlideToggle from 'src/reusable_ui/components/slide_toggle/SlideToggle'
import {ComponentColor, ComponentSize} from 'src/reusable_ui/types'

interface Props {
  isChecked: boolean
  text: string
  onChange: (isChecked: boolean) => void
}

@ErrorHandling
class WizardCheckbox extends PureComponent<Props> {
  public render() {
    const {text, isChecked} = this.props

    return (
      <div className="form-group col-xs-12 wizard-checkbox--group">
        <div className="form-control-static">
          <SlideToggle
            color={ComponentColor.Success}
            size={ComponentSize.ExtraSmall}
            active={isChecked}
            onChange={this.onChangeSlideToggle}
            tooltipText={text}
          />
          <span
            className="wizard-checkbox--label"
            onClick={this.onChangeSlideToggle}
          >
            {text}
          </span>
        </div>
      </div>
    )
  }

  private onChangeSlideToggle = () => {
    const {onChange, isChecked} = this.props
    onChange(!isChecked)
  }
}

export default WizardCheckbox
