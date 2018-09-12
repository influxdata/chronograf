import React, {Component} from 'react'

import ColorScaleDropdown from 'src/shared/components/ColorScaleDropdown'

import {ColorString} from 'src/types/colors'
import {ErrorHandling} from 'src/shared/decorators/errors'

interface Props {
  lineColors: ColorString[]
  onUpdateLineColors: (colors: ColorString[]) => void
}

@ErrorHandling
class LineGraphColorSelector extends Component<Props> {
  public render() {
    const {lineColors} = this.props

    return (
      <div className="form-group col-xs-12">
        <label>Line Colors</label>
        <ColorScaleDropdown
          onChoose={this.handleSelectColors}
          stretchToFit={true}
          selected={lineColors}
        />
      </div>
    )
  }

  public handleSelectColors = (colorScale): void => {
    const {onUpdateLineColors} = this.props
    const {colors} = colorScale

    onUpdateLineColors(colors)
  }
}

export default LineGraphColorSelector
