import * as React from 'react'

import GraphTypeSelector from 'dashboards/components/GraphTypeSelector'
import AxesOptions from 'dashboards/components/AxesOptions'
import {buildDefaultYLabel} from 'shared/presenters'
import {Axes, GraphType, QueryConfig} from 'src/types'
import {DISPLAY_OPTIONS} from 'dashboards/constants'

export interface DisplayOptionsProps {
  selectedGraphType: GraphType
  axes: Axes
  queryConfigs: QueryConfig[]
  onSelectGraphType: (graphType: GraphType) => () => void
  onSetPrefixSuffix: (e: {}) => void
  onSetYAxisBoundMin: (min: string) => void
  onSetYAxisBoundMax: (max: string) => void
  onSetLabel: (label: string) => void
  onSetScale: (base: DISPLAY_OPTIONS) => () => void
  onSetBase: (base: DISPLAY_OPTIONS) => () => void
}

export interface DisplayOptionsState {
  axes: Axes
}

class DisplayOptions extends React.Component<
  DisplayOptionsProps,
  DisplayOptionsState
> {
  constructor(props: DisplayOptionsProps) {
    super(props)

    const {axes, queryConfigs} = props

    this.state = {
      axes: this.setDefaultLabels(axes, queryConfigs),
    }
  }

  private setDefaultLabels(axes: Axes, queryConfigs: QueryConfig[]) {
    return queryConfigs.length
      ? {
          ...axes,
          y: {...axes.y, defaultYLabel: buildDefaultYLabel(queryConfigs[0])},
        }
      : axes
  }

  public componentWillReceiveProps(nextProps: DisplayOptionsProps) {
    const {axes, queryConfigs} = nextProps

    this.setState({axes: this.setDefaultLabels(axes, queryConfigs)})
  }

  public render() {
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

export default DisplayOptions
