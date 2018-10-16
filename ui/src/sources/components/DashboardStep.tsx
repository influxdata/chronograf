// Libraries
import React, {Component} from 'react'
import {connect} from 'react-redux'
import _ from 'lodash'

// APIs
import {getProtoboards} from 'src/sources/apis'
import {createDashboardFromProtoboard} from 'src/dashboards/apis'

// Decorators
import {ErrorHandling} from 'src/shared/decorators/errors'

// Utils
import {isSearchMatch} from 'src/utils/searchMatch'
import {getSuggestedProtoboards} from 'src/dashboards/utils/protoboardSuggestion'

// Components
import GridSizer from 'src/reusable_ui/components/grid_sizer/GridSizer'
import CardSelectCard from 'src/reusable_ui/components/card_select/CardSelectCard'
import SearchBar from 'src/hosts/components/SearchBar'

// Actions
import {notify as notifyAction} from 'src/shared/actions/notifications'

// Constants
import {
  notifyDashboardCreated,
  notifyDashboardCreationFailed,
  notifyNoSuggestedDashboards,
} from 'src/shared/copy/notifications'

// Types
import {Protoboard, Source} from 'src/types'
import {NextReturn} from 'src/types/wizard'

interface State {
  selected: object
  searchTerm: string
  protoboards: Protoboard[]
  suggestedProtoboards: Protoboard[]
}

interface Props {
  notify: typeof notifyAction
  dashboardsCreated: Protoboard[]
  source: Source
  countSelected: (selectedDashboards: number) => void
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
      searchTerm: '',
      suggestedProtoboards: [],
    }
  }

  public async componentDidMount() {
    const protoboards = await getProtoboards()
    this.setState({protoboards}, this.handleSuggest)
  }

  public next = async (): Promise<NextReturn> => {
    const {selected, protoboards} = this.state
    const {dashboardsCreated, notify, source} = this.props

    const selectedProtoboards = protoboards.filter(p => selected[p.id])

    const newSelectedProtoboards = protoboards.filter(
      p =>
        selected[p.id] &&
        !_.find(dashboardsCreated, d => {
          return d.id === p.id
        })
    )
    const countNew = newSelectedProtoboards.length

    try {
      newSelectedProtoboards.forEach(p => {
        createDashboardFromProtoboard(p, source)
      })
      if (countNew > 0) {
        notify(notifyDashboardCreated(countNew))
      }
      return {error: false, payload: selectedProtoboards}
    } catch (err) {
      notify(notifyDashboardCreationFailed(countNew))
      return {error: true, payload: dashboardsCreated}
    }
  }

  public render() {
    const {protoboards} = this.state
    if (protoboards && protoboards.length) {
      return (
        <div className="dashboard-step">
          <div className="dashboard-step--filter-controls">
            <SearchBar
              placeholder="Filter by name..."
              onSearch={this.setSearchTerm}
            />
          </div>
          {this.suggestedDashboardCards}
          {this.dashboardCards}
        </div>
      )
    }
    return <div />
  }

  private setSearchTerm = searchTerm => {
    this.setState({searchTerm})
  }

  private get dashboardCards() {
    const {selected, protoboards, suggestedProtoboards, searchTerm} = this.state
    const filteredProtoboards = protoboards.filter(
      pb =>
        isSearchMatch(pb.meta.name, searchTerm) &&
        !suggestedProtoboards.find(spb => spb.id === pb.id)
    )

    return (
      <>
        <GridSizer>
          {filteredProtoboards.map((protoboard, i) => {
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
          })}
        </GridSizer>
      </>
    )
  }

  private get suggestedDashboardCards() {
    const {selected, suggestedProtoboards, searchTerm} = this.state

    const filteredProtoboards = suggestedProtoboards.filter(pb =>
      isSearchMatch(pb.meta.name, searchTerm)
    )

    if (filteredProtoboards.length === 0) {
      return null
    }

    return (
      <>
        <div className="suggestion-text">
          Suggested Dashboards for your Source:
        </div>
        <GridSizer>
          {filteredProtoboards.map((protoboard, i) => {
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
          })}
        </GridSizer>
        <div className="suggestion-text">Other Dashboards:</div>
      </>
    )
  }

  private handleSuggest = async () => {
    const {protoboards} = this.state
    const {source, notify} = this.props

    const suggestedProtoboardsList = await getSuggestedProtoboards(
      source,
      protoboards
    )

    if (suggestedProtoboardsList.length === 0) {
      notify(notifyNoSuggestedDashboards())
      return
    }

    const suggestedProtoboards = protoboards.filter(p =>
      suggestedProtoboardsList.includes(p.meta.name)
    )

    this.setState({suggestedProtoboards})
  }

  private toggleChecked = (id: string) => () => {
    const {selected} = this.state
    const {dashboardsCreated} = this.props

    const newSelected = selected
    const dashboardAlreadyCreated = dashboardsCreated.find(d => d.id === id)

    if (!dashboardAlreadyCreated) {
      if (selected[id]) {
        newSelected[id] = false
      } else {
        newSelected[id] = true
      }

      this.setState(
        {
          selected: newSelected,
        },
        this.countSelectedDashboards
      )
    }
  }

  private countSelectedDashboards = () => {
    const {countSelected} = this.props
    const {selected} = this.state
    const selectedDashboards = _.filter(selected, v => v === true).length

    countSelected(selectedDashboards)
  }
}

const mdtp = {
  notify: notifyAction,
}

export default connect(null, mdtp, null, {withRef: true})(DashboardStep)
