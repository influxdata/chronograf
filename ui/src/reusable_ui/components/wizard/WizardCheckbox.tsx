import React, {PureComponent} from 'react'
import {ErrorHandling} from 'src/shared/decorators/errors'
import SlideToggle from 'src/reusable_ui/components/slide_toggle/SlideToggle'
import {ComponentColor, ComponentSize} from 'src/reusable_ui/types'

import './wizard-text-input.scss'

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
      <div className="form-group col-xs-12">
        <div className=" form-control-static">
          <SlideToggle
            color={ComponentColor.Success}
            size={ComponentSize.ExtraSmall}
            active={isChecked}
            onChange={this.onChangeSlideToggle}
          />
          {text}
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
