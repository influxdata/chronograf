// Libraries
import React, {Component} from 'react'

// APIs
import {getProtoBoards} from 'src/sources/apis'

// Components
import {ErrorHandling} from 'src/shared/decorators/errors'
import GridSizer from 'src/reusable_ui/components/grid_sizer/GridSizer'
import CardSelectCard from 'src/reusable_ui/components/card_select/CardSelectCard'

// Types
import {Protoboard} from 'src/types'

interface State {
  selected: object
  protoboards: Protoboard[]
}

@ErrorHandling
class DashboardStep extends Component<{}, State> {
  public constructor(props) {
    super(props)
    this.state = {
      selected: {},
      protoboards: [],
    }
  }

  public async componentDidMount() {
    const {
      data: {protoboards},
    } = await getProtoBoards()

    this.setState({protoboards})
  }

  public render() {
    const {protoboards} = this.state
    if (protoboards && protoboards.length) {
      return (
        <div className="dashboard-step">
          <GridSizer>{this.dashboardCards}</GridSizer>
        </div>
      )
    }
    return <div />
  }

  private get dashboardCards() {
    const {selected, protoboards} = this.state

    return protoboards.map((protoboard, i) => {
      const {meta} = protoboard
      return (
        <CardSelectCard
          key={`${protoboard.id}_${i}`}
          id={meta.name}
          name={meta.name}
          label={meta.name}
          checked={selected[meta.name]}
          onClick={this.toggleChecked(meta.name)}
        />
      )
    })
  }

  private toggleChecked = (name: string) => () => {
    const {selected} = this.state

    const newSelected = selected

    if (selected[name]) {
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
