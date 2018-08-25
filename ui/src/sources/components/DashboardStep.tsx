// Libraries
import React, {Component} from 'react'
import {connect} from 'react-redux'
import _ from 'lodash'

// APIs
import {getProtoBoards} from 'src/sources/apis'
import {createDashboardFromProtoboard} from 'src/dashboards/apis'

// Components
import {ErrorHandling} from 'src/shared/decorators/errors'
import GridSizer from 'src/reusable_ui/components/grid_sizer/GridSizer'
import CardSelectCard from 'src/reusable_ui/components/card_select/CardSelectCard'

// Actions
import {notify as notifyAction} from 'src/shared/actions/notifications'

// Types
import {Protoboard} from 'src/types'
import {NextReturn} from 'src/types/wizard'

interface State {
  selected: object
  protoboards: Protoboard[]
}

interface Props {
  dashboardsCreated: Protoboard[]
}

@ErrorHandling
class DashboardStep extends Component<Props, State> {
  public constructor(props: Props) {
    super(props)
    const selected = props.dashboardsCreated.reduce(
      (acc, d) => ({...acc, [d.id]: true}),
      {}
    )
    this.state = {
      selected,
      protoboards: [],
    }
  }

  public async componentDidMount() {
    const protoboards = await getProtoBoards()
    this.setState({protoboards})
  }

  public next = async (): Promise<NextReturn> => {
    const {selected, protoboards} = this.state
    const {dashboardsCreated} = this.props

    const selectedProtoboards = protoboards.filter(p => selected[p.id])

    const newSelectedProtoboards = protoboards.filter(
      p =>
        selected[p.id] &&
        !_.find(dashboardsCreated, d => {
          return d.id === p.id
        })
    )

    try {
      newSelectedProtoboards.forEach(p => {
        createDashboardFromProtoboard(p)
      })
      return {error: false, payload: selectedProtoboards}
    } catch (err) {
      return {error: true, payload: null}
    }
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
      const {meta, id} = protoboard
      return (
        <CardSelectCard
          key={`${id}_${i}`}
          id={id}
          name={meta.name}
          label={meta.name}
          checked={selected[id]}
          onClick={this.toggleChecked(id)}
        />
      )
    })
  }

  private toggleChecked = (id: string) => () => {
    const {selected} = this.state

    const newSelected = selected

    if (selected[id]) {
      newSelected[id] = false
    } else {
      newSelected[id] = true
    }

    this.setState({
      selected: newSelected,
    })
  }
}

const mdtp = {
  notify: notifyAction,
}

export default connect(null, mdtp, null, {withRef: true})(DashboardStep)
