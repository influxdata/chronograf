import React, {Component} from 'react'
import PropTypes from 'prop-types'
import {connect} from 'react-redux'
import {bindActionCreators} from 'redux'

import FancyScrollbar from 'src/shared/components/FancyScrollbar'
import ThresholdsList from 'src/shared/components/ThresholdsList'
import ThresholdsListTypeToggle from 'src/shared/components/ThresholdsListTypeToggle'
import GraphOptionsDecimalPlaces from 'src/dashboards/components/GraphOptionsDecimalPlaces'

import {
  updateAxes,
  changeDecimalPlaces,
} from 'src/dashboards/actions/cellEditorOverlay'
import {ErrorHandling} from 'src/shared/decorators/errors'

@ErrorHandling
class SingleStatOptions extends Component {
  handleUpdatePrefix = e => {
    const {handleUpdateAxes, axes} = this.props
    const newAxes = {...axes, y: {...axes.y, prefix: e.target.value}}

    handleUpdateAxes(newAxes)
  }

  handleUpdateSuffix = e => {
    const {handleUpdateAxes, axes} = this.props
    const newAxes = {...axes, y: {...axes.y, suffix: e.target.value}}

    handleUpdateAxes(newAxes)
  }

  handleDecimalPlacesChange = decimalPlaces => {
    const {handleChangeDecimalPlaces} = this.props
    handleChangeDecimalPlaces(decimalPlaces)
  }

  render() {
    const {
      axes: {
        y: {prefix, suffix},
      },
      decimalPlaces,
      onResetFocus,
    } = this.props

    return (
      <FancyScrollbar
        className="display-options--cell y-axis-controls"
        autoHide={false}
      >
        <div className="display-options--cell-wrapper">
          <h5 className="display-options--header">Single Stat Controls</h5>
          <ThresholdsList onResetFocus={onResetFocus} />
          <div className="graph-options-group form-group-wrapper">
            <div className="form-group col-xs-6">
              <label>Prefix</label>
              <input
                className="form-control input-sm"
                placeholder="%, MPH, etc."
                defaultValue={prefix}
                onChange={this.handleUpdatePrefix}
                maxLength="5"
              />
            </div>
            <div className="form-group col-xs-6">
              <label>Suffix</label>
              <input
                className="form-control input-sm"
                placeholder="%, MPH, etc."
                defaultValue={suffix}
                onChange={this.handleUpdateSuffix}
                maxLength="5"
              />
            </div>
            <ThresholdsListTypeToggle containerClass="form-group col-xs-6" />
            <GraphOptionsDecimalPlaces
              digits={decimalPlaces.digits}
              isEnforced={decimalPlaces.isEnforced}
              onDecimalPlacesChange={this.handleDecimalPlacesChange}
            />
          </div>
        </div>
      </FancyScrollbar>
    )
  }
}

const {bool, func, number, shape} = PropTypes

SingleStatOptions.propTypes = {
  handleUpdateAxes: func.isRequired,
  axes: shape({}).isRequired,
  onResetFocus: func.isRequired,
  handleChangeDecimalPlaces: func.isRequired,
  decimalPlaces: shape({
    isEnforced: bool.isRequired,
    digits: number.isRequired,
  }).isRequired,
}

const mapStateToProps = ({
  cellEditorOverlay: {
    cell: {axes, decimalPlaces},
  },
}) => ({
  axes,
  decimalPlaces,
})

const mapDispatchToProps = dispatch => ({
  handleUpdateAxes: bindActionCreators(updateAxes, dispatch),
  handleChangeDecimalPlaces: bindActionCreators(changeDecimalPlaces, dispatch),
})

export default connect(mapStateToProps, mapDispatchToProps)(SingleStatOptions)
