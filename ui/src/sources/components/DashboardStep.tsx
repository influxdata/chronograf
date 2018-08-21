// Libraries
import React, {Component} from 'react'

// Components
import {ErrorHandling} from 'src/shared/decorators/errors'
import GridSizer from 'src/reusable_ui/components/grid_sizer/GridSizer'
import CardSelectCard from 'src/reusable_ui/components/card_select/CardSelectCard'

// Types
import {Protoboard} from 'src/types'

import './DashboardStep.scss'

interface State {
  selected: object
}

interface Props {
  dashboards?: Protoboard[]
}

@ErrorHandling
class DashboardStep extends Component<Props, State> {
  public constructor(props) {
    super(props)
    this.state = {
      selected: {},
    }
  }

  public render() {
    return (
      <div className="dashboard-step">
        <GridSizer>{this.dashboardCards}</GridSizer>
      </div>
    )
  }

  private get dashboardCards() {
    const {selected} = this.state
    const {dashboards} = this.props

    const cards =
      dashboards &&
      dashboards.map((dashboard, i) => {
        const {meta} = dashboard
        return (
          <CardSelectCard
            key={`${dashboard.id}_${i}`}
            id={meta.name}
            name={meta.name}
            label={meta.name}
            checked={selected[meta.name]}
            onClick={this.toggleChecked(meta.name)}
          />
        )
      })

    if (cards.length) {
      return cards
    }

    return null
  }

  private toggleChecked = (name: string) => () => {
    const {selected} = this.state

    const newSelected = selected

    if (newSelected[name]) {
      newSelected[name] = false
    } else {
      newSelected[name] = true
    }

    this.setState({
      selected: newSelected,
    })
  }
}

export default DashboardStep
