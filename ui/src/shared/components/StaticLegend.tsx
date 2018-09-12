// Libraries
import React, {Component, MouseEvent} from 'react'
import _ from 'lodash'
import uuid from 'uuid'
import classnames from 'classnames'

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

  public componentDidMount = () => {
    const {height} = this.staticLegendRef.current.getBoundingClientRect()
    this.props.onUpdateHeight(height)
  }

  public componentDidUpdate = prevProps => {
    const {height} = this.staticLegendRef.current.getBoundingClientRect()

    if (prevProps.height === height) {
      return
    }

    this.props.onUpdateHeight(height)
  }

  public componentWillUnmount = () => {
    this.props.onUpdateHeight(0)
  }

  public render() {
    const {dygraphSeries} = this.props
    const {visibilities} = this.state
    const labels = _.keys(dygraphSeries)
    const colors = _.map(labels, l => dygraphSeries[l].color)

    const hoverEnabled = labels.length > 1

    return (
      <div className="static-legend" ref={this.staticLegendRef}>
        {_.map(labels, (v, i) => (
          <div
            className={this.staticLegendItemClassname(
              visibilities,
              i,
              hoverEnabled
            )}
            key={uuid.v4()}
            onMouseDown={this.handleClick(i)}
          >
            <span style={{color: colors[i]}}>{removeMeasurement(v)}</span>
          </div>
        ))}
      </div>
    )
  }

  public handleClick = (i: number) => (e: MouseEvent<HTMLDivElement>): void => {
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

  private staticLegendItemClassname = (visibilities, i, hoverEnabled) => {
    return classnames('', {
      disabled: !visibilities[i],
      'static-legend--item': hoverEnabled,
      'static-legend--single': !hoverEnabled,
    })
  }
}

export default StaticLegend
