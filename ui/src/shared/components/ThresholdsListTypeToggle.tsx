// Libraries
import React, {Component} from 'react'

// Components
import {Radio, ButtonShape} from 'src/reusable_ui'

// Constants
import {
  THRESHOLD_TYPE_TEXT,
  THRESHOLD_TYPE_BG,
} from 'src/shared/constants/thresholds'

// Decorators
import {ErrorHandling} from 'src/shared/decorators/errors'

// Types
import {ThresholdType} from 'src/types/dashboards'

interface Props {
  containerClass: string
  thresholdsListType: ThresholdType
  onUpdateThresholdsListType: (newType: ThresholdType) => void
}

@ErrorHandling
class ThresholdsListTypeToggle extends Component<Props> {
  public render() {
    const {
      containerClass,
      thresholdsListType,
      onUpdateThresholdsListType,
    } = this.props

    return (
      <div className={containerClass}>
        <label>Threshold Coloring</label>
        <Radio shape={ButtonShape.StretchToFit}>
          <Radio.Button
            id="threshold-list-type--background"
            value={THRESHOLD_TYPE_BG}
            active={thresholdsListType === THRESHOLD_TYPE_BG}
            onClick={onUpdateThresholdsListType}
            titleText="Apply coloration to cell background"
          >
            Background
          </Radio.Button>
          <Radio.Button
            id="threshold-list-type--text"
            value={THRESHOLD_TYPE_TEXT}
            active={thresholdsListType === THRESHOLD_TYPE_TEXT}
            onClick={onUpdateThresholdsListType}
            titleText="Apply coloration to cell text"
          >
            Text
          </Radio.Button>
        </Radio>
      </div>
    )
  }
}

export default ThresholdsListTypeToggle
