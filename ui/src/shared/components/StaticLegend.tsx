// Libraries
import React, {Component, MouseEvent} from 'react'
import _ from 'lodash'

// Components
import StaticLegendItem from 'src/shared/components/StaticLegendItem'

// Utilities
import {removeMeasurement} from 'src/shared/graphs/helpers'

// Decorators
import {ErrorHandling} from 'src/shared/decorators/errors'

// Types
import {DygraphClass, DygraphSeries} from 'src/types'

interface Props {
  dygraph: DygraphClass
  dygraphSeries: DygraphSeries
  height: number
  onUpdateHeight: (height: number) => void
}

interface State {
  visibilities: boolean[]
  clickStatus: boolean
}

@ErrorHandling
class StaticLegend extends Component<Props, State> {
  private staticLegendRef: React.RefObject<HTMLDivElement>

  constructor(props) {
    super(props)

    this.staticLegendRef = React.createRef()

    this.state = {
      visibilities: [],
      clickStatus: false,
    }
  }

  public componentDidMount() {
    const {height} = this.staticLegendRef.current.getBoundingClientRect()
    this.props.onUpdateHeight(height)
  }

  public componentDidUpdate(prevProps) {
    const {height} = this.staticLegendRef.current.getBoundingClientRect()

    if (prevProps.height === height) {
      return
    }

    this.props.onUpdateHeight(height)
  }

  public componentWillUnmount() {
    this.props.onUpdateHeight(0)
  }

  public render() {
    const {visibilities} = this.state

    return (
      <div className="static-legend" ref={this.staticLegendRef}>
        {_.map(this.labels, (v, i) => (
          <StaticLegendItem
            index={i}
            onMouseDown={this.handleMouseDown}
            hoverEnabled={this.multipleLabelsExist}
            color={this.labelColors[i]}
            label={removeMeasurement(v)}
            key={`static-legend--${i}-${removeMeasurement(v)}`}
            enabled={visibilities[i]}
          />
        ))}
      </div>
    )
  }

  private get multipleLabelsExist(): boolean {
    return this.labels.length > 1
  }

  private get labels(): string[] {
    const {dygraphSeries} = this.props

    return _.keys(dygraphSeries)
  }

  private get labelColors(): string[] {
    const {dygraphSeries} = this.props

    return _.map(this.labels, l => dygraphSeries[l].color)
  }

  private handleMouseDown = (
    i: number,
    e: MouseEvent<HTMLDivElement>
  ): void => {
    const visibilities = this.props.dygraph.visibility()
    const clickStatus = this.state.clickStatus

    if (e.shiftKey || e.metaKey) {
      visibilities[i] = !visibilities[i]
      this.props.dygraph.setVisibility(visibilities)

      this.setState({visibilities})
      return
    }

    const prevClickStatus = clickStatus && visibilities[i]

    const newVisibilities = prevClickStatus
      ? _.map(visibilities, () => true)
      : _.map(visibilities, () => false)

    newVisibilities[i] = true

    this.props.dygraph.setVisibility(newVisibilities)

    this.setState({
      visibilities: newVisibilities,
      clickStatus: !prevClickStatus,
    })
  }
}

export default StaticLegend
