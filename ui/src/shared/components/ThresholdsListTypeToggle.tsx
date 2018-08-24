// Libraries
import React, {Component} from 'react'
import {connect} from 'react-redux'

// Components
import {Radio, ButtonShape} from 'src/reusable_ui'

// Actions
import {updateThresholdsListType} from 'src/dashboards/actions/cellEditorOverlay'

// Constants
import {
  THRESHOLD_TYPE_TEXT,
  THRESHOLD_TYPE_BG,
} from 'src/shared/constants/thresholds'

// Decorators
import {ErrorHandling} from 'src/shared/decorators/errors'

interface PropsFromRedux {
  thresholdsListType: string
}
interface PropsFromParent {
  containerClass: string
  handleUpdateThresholdsListType: (newType: string) => void
}

type Props = PropsFromRedux & PropsFromParent

@ErrorHandling
class ThresholdsListTypeToggle extends Component<Props> {
  public render() {
    const {
      containerClass,
      thresholdsListType,
      handleUpdateThresholdsListType,
    } = this.props

    return (
      <div className={containerClass}>
        <label>Threshold Coloring</label>
        <Radio shape={ButtonShape.StretchToFit}>
          <Radio.Button
            id="threshold-list-type--background"
            value={THRESHOLD_TYPE_BG}
            active={thresholdsListType === THRESHOLD_TYPE_BG}
            onClick={handleUpdateThresholdsListType}
            titleText="Apply coloration to cell background"
          >
            Background
          </Radio.Button>
          <Radio.Button
            id="threshold-list-type--text"
            value={THRESHOLD_TYPE_TEXT}
            active={thresholdsListType === THRESHOLD_TYPE_TEXT}
            onClick={handleUpdateThresholdsListType}
            titleText="Apply coloration to cell text"
          >
            Text
          </Radio.Button>
        </Radio>
      </div>
    )
  }
}

const mapStateToProps = ({
  cellEditorOverlay: {thresholdsListType},
}): PropsFromRedux => ({
  thresholdsListType,
})

const mapDispatchToProps = {
  handleUpdateThresholdsListType: updateThresholdsListType,
}

export default connect(mapStateToProps, mapDispatchToProps)(
  ThresholdsListTypeToggle
)
