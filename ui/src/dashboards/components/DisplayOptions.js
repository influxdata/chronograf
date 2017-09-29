import React, {Component, PropTypes} from 'react'

import GraphTypeSelector from 'src/dashboards/components/GraphTypeSelector'
import AxesOptions from 'src/dashboards/components/AxesOptions'

import {buildDefaultYLabel} from 'shared/presenters'

class DisplayOptions extends Component {
  constructor(props) {
    super(props)

    const {axes, queryConfig} = props

    this.state = {
      axes: this.setDefaultLabels(axes, queryConfig),
    }
  }

  componentWillReceiveProps(nextProps) {
    const {axes, queryConfig} = nextProps

    this.setState({axes: this.setDefaultLabels(axes, queryConfig)})
  }

  setDefaultLabels(axes, queryConfig) {
    return queryConfig
      ? {
          ...axes,
          y: {...axes.y, defaultYLabel: buildDefaultYLabel(queryConfig)},
        }
      : axes
  }

  render() {
    const {
      onSetBase,
      onSetScale,
      onSetLabel,
      selectedGraphType,
      onSelectGraphType,
      onSetPrefixSuffix,
      onSetYAxisBoundMin,
      onSetYAxisBoundMax,
    } = this.props
    const {axes} = this.state

    return (
      <div className="display-options">
        <AxesOptions
          axes={axes}
          onSetBase={onSetBase}
          onSetLabel={onSetLabel}
          onSetScale={onSetScale}
          onSetPrefixSuffix={onSetPrefixSuffix}
          onSetYAxisBoundMin={onSetYAxisBoundMin}
          onSetYAxisBoundMax={onSetYAxisBoundMax}
        />
        <GraphTypeSelector
          selectedGraphType={selectedGraphType}
          onSelectGraphType={onSelectGraphType}
        />
      </div>
    )
  }
}
const {func, shape, string} = PropTypes

DisplayOptions.propTypes = {
  selectedGraphType: string.isRequired,
  onSelectGraphType: func.isRequired,
  onSetPrefixSuffix: func.isRequired,
  onSetYAxisBoundMin: func.isRequired,
  onSetYAxisBoundMax: func.isRequired,
  onSetScale: func.isRequired,
  onSetLabel: func.isRequired,
  onSetBase: func.isRequired,
  axes: shape({}).isRequired,
  queryConfig: shape().isRequired,
}

export default DisplayOptions
