// Libraries
import React, {PureComponent} from 'react'
import _ from 'lodash'
import uuid from 'uuid'

// Comonents
import Threshold from 'src/dashboards/components/Threshold'
import ColorDropdown from 'src/shared/components/ColorDropdown'

// Decorators
import {ErrorHandling} from 'src/shared/decorators/errors'

// Types
import {ColorNumber} from 'src/types/colors'

import {
  THRESHOLD_COLORS,
  DEFAULT_VALUE_MIN,
  DEFAULT_VALUE_MAX,
  MAX_THRESHOLDS,
  THRESHOLD_TYPE_BASE,
} from 'src/shared/constants/thresholds'

interface Props {
  onResetFocus: () => void
  showListHeading?: boolean
  thresholdsListType: string
  thresholdsListColors: ColorNumber[]
  onUpdateThresholdsListColors: (c: ColorNumber[]) => void
}

@ErrorHandling
class ThresholdsList extends PureComponent<Props> {
  public static defaultProps: Partial<Props> = {
    showListHeading: false,
  }

  private get sortedColors() {
    const {thresholdsListColors} = this.props
    const sortedColors = _.sortBy(thresholdsListColors, 'value')

    return sortedColors
  }

  public render() {
    const {thresholdsListColors, showListHeading} = this.props
    const disableAddThreshold = thresholdsListColors.length > MAX_THRESHOLDS

    const thresholdsListClass = `thresholds-list${
      showListHeading ? ' graph-options-group' : ''
    }`

    return (
      <div className={thresholdsListClass}>
        {showListHeading && <label className="form-label">Thresholds</label>}
        <button
          className="btn btn-sm btn-primary"
          onClick={this.handleAddThreshold}
          disabled={disableAddThreshold}
        >
          <span className="icon plus" /> Add Threshold
        </button>
        {this.sortedColors.map(
          color =>
            color.id === THRESHOLD_TYPE_BASE ? (
              <div className="threshold-item" key={uuid.v4()}>
                <div className="threshold-item--label">Base Color</div>
                <ColorDropdown
                  colors={THRESHOLD_COLORS}
                  selected={color}
                  onChoose={this.handleChangeBaseColor}
                  stretchToFit={true}
                />
              </div>
            ) : (
              <Threshold
                visualizationType="single-stat"
                threshold={color}
                key={uuid.v4()}
                onChooseColor={this.handleChooseColor}
                onValidateColorValue={this.handleValidateColorValue}
                onUpdateColorValue={this.handleUpdateColorValue}
                onDeleteThreshold={this.handleDeleteThreshold}
                disableMaxColor={false}
                isMin={false}
                isMax={false}
              />
            )
        )}
      </div>
    )
  }
  private handleAddThreshold = () => {
    const {
      thresholdsListColors,
      thresholdsListType,
      onUpdateThresholdsListColors,
      onResetFocus,
    } = this.props

    const randomColor = _.random(0, THRESHOLD_COLORS.length - 1)

    const maxValue = DEFAULT_VALUE_MIN
    const minValue = DEFAULT_VALUE_MAX

    let randomValue = _.round(_.random(minValue, maxValue, true), 2)

    if (thresholdsListColors.length > 0) {
      const colorsValues = _.mapValues(thresholdsListColors, 'value')
      do {
        randomValue = _.round(_.random(minValue, maxValue, true), 2)
      } while (_.includes(colorsValues, randomValue))
    }

    const newThreshold = {
      type: thresholdsListType,
      id: uuid.v4(),
      value: randomValue,
      hex: THRESHOLD_COLORS[randomColor].hex,
      name: THRESHOLD_COLORS[randomColor].name,
    }

    const updatedColors = _.sortBy(
      [...thresholdsListColors, newThreshold],
      color => color.value
    )

    onUpdateThresholdsListColors(updatedColors)
    onResetFocus()
  }

  private handleChangeBaseColor = updatedColor => {
    const {onUpdateThresholdsListColors} = this.props
    const {hex, name} = updatedColor

    const thresholdsListColors = this.props.thresholdsListColors.map(
      color =>
        color.id === THRESHOLD_TYPE_BASE ? {...color, hex, name} : color
    )

    onUpdateThresholdsListColors(thresholdsListColors)
  }

  private handleChooseColor = updatedColor => {
    const {onUpdateThresholdsListColors} = this.props

    const thresholdsListColors = this.props.thresholdsListColors.map(
      color => (color.id === updatedColor.id ? updatedColor : color)
    )

    onUpdateThresholdsListColors(thresholdsListColors)
  }

  private handleDeleteThreshold = threshold => {
    const {
      onUpdateThresholdsListColors,
      onResetFocus,
      thresholdsListColors,
    } = this.props
    const updatedThresholdsListColors = thresholdsListColors.filter(
      color => color.id !== threshold.id
    )
    const sortedColors = _.sortBy(
      updatedThresholdsListColors,
      color => color.value
    )

    onUpdateThresholdsListColors(sortedColors)
    onResetFocus()
  }

  private handleUpdateColorValue = (threshold, value) => {
    const {onUpdateThresholdsListColors} = this.props

    const thresholdsListColors = this.props.thresholdsListColors.map(
      color => (color.id === threshold.id ? {...color, value} : color)
    )

    onUpdateThresholdsListColors(thresholdsListColors)
  }

  private handleValidateColorValue = (__, targetValue) => {
    const {thresholdsListColors} = this.props
    const sortedColors = _.sortBy(thresholdsListColors, color => color.value)

    return !sortedColors.some(color => color.value === targetValue)
  }
}

export default ThresholdsList
