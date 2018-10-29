// Libraries
import React, {PureComponent} from 'react'

// Components
import FancyScrollbar from 'src/shared/components/FancyScrollbar'
import ThresholdsList from 'src/shared/components/ThresholdsList'
import ThresholdsListTypeToggle from 'src/shared/components/ThresholdsListTypeToggle'
import GraphOptionsDecimalPlaces from 'src/dashboards/components/GraphOptionsDecimalPlaces'

// Types
import {ErrorHandling} from 'src/shared/decorators/errors'
import {Axes} from 'src/types'
import {DecimalPlaces, ThresholdType} from 'src/types/dashboards'
import {ColorNumber} from 'src/types/colors'

interface Props {
  axes: Axes
  decimalPlaces: DecimalPlaces
  thresholdsListType: ThresholdType
  thresholdsListColors: ColorNumber[]
  onResetFocus: () => void
  onUpdateAxes: (axes: Axes) => void
  onUpdateThresholdsListColors: (c: ColorNumber[]) => void
  onUpdateThresholdsListType: (newType: ThresholdType) => void
  onUpdateDecimalPlaces: (decimalPlaces: DecimalPlaces) => void
}

@ErrorHandling
class SingleStatOptions extends PureComponent<Props> {
  public render() {
    const {
      axes: {
        y: {prefix, suffix},
      },
      onResetFocus,
      decimalPlaces,
      onUpdateThresholdsListColors,
      thresholdsListType,
      thresholdsListColors,
      onUpdateThresholdsListType,
    } = this.props

    return (
      <FancyScrollbar className="display-options" autoHide={false}>
        <div className="display-options--wrapper">
          <h5 className="display-options--header">Single Stat Controls</h5>
          <ThresholdsList
            onResetFocus={onResetFocus}
            thresholdsListType={thresholdsListType}
            thresholdsListColors={thresholdsListColors}
            onUpdateThresholdsListColors={onUpdateThresholdsListColors}
          />
          <div className="graph-options-group form-group-wrapper">
            <div className="form-group col-xs-6">
              <label>Prefix</label>
              <input
                className="form-control input-sm"
                placeholder="%, MPH, etc."
                defaultValue={prefix}
                onChange={this.handleUpdatePrefix}
              />
            </div>
            <div className="form-group col-xs-6">
              <label>Suffix</label>
              <input
                className="form-control input-sm"
                placeholder="%, MPH, etc."
                defaultValue={suffix}
                onChange={this.handleUpdateSuffix}
              />
            </div>
            <GraphOptionsDecimalPlaces
              digits={decimalPlaces.digits}
              isEnforced={decimalPlaces.isEnforced}
              onDecimalPlacesChange={this.handleDecimalPlacesChange}
            />
            <ThresholdsListTypeToggle
              containerClass="form-group col-xs-6"
              thresholdsListType={thresholdsListType}
              onUpdateThresholdsListType={onUpdateThresholdsListType}
            />
          </div>
        </div>
      </FancyScrollbar>
    )
  }

  private handleDecimalPlacesChange = (decimalPlaces: DecimalPlaces) => {
    const {onUpdateDecimalPlaces} = this.props
    onUpdateDecimalPlaces(decimalPlaces)
  }

  private handleUpdatePrefix = e => {
    const {onUpdateAxes, axes} = this.props
    const newAxes = {...axes, y: {...axes.y, prefix: e.target.value}}

    onUpdateAxes(newAxes)
  }

  private handleUpdateSuffix = e => {
    const {onUpdateAxes, axes} = this.props
    const newAxes = {...axes, y: {...axes.y, suffix: e.target.value}}

    onUpdateAxes(newAxes)
  }
}

export default SingleStatOptions
