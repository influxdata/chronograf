import * as React from 'react'
import * as PropTypes from 'prop-types'

import GraphTypeSelector from 'dashboards/components/GraphTypeSelector'
import AxesOptions from 'dashboards/components/AxesOptions'

import {buildDefaultYLabel} from 'shared/presenters'

class DisplayOptions extends React.Component {
  constructor(props) {
    super(props)

    const {axes, queryConfigs} = props

    this.state = {
      axes: this.setDefaultLabels(axes, queryConfigs),
    }
  }

  componentWillReceiveProps(nextProps) {
    const {axes, queryConfigs} = nextProps

    this.setState({axes: this.setDefaultLabels(axes, queryConfigs)})
  }

  setDefaultLabels(axes, queryConfigs) {
    return queryConfigs.length
      ? {
          ...axes,
          y: {...axes.y, defaultYLabel: buildDefaultYLabel(queryConfigs[0])},
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
const {arrayOf, func, shape, string} = PropTypes

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
  queryConfigs: arrayOf(shape()).isRequired,
}

export default DisplayOptions
