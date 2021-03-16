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
import PageSpinner from 'src/shared/components/PageSpinner'

// Actions
import {notify as notifyAction} from 'src/shared/actions/notifications'

// Constants
import {
  notifyDashboardCreated,
  notifyDashboardCreationFailed,
} from 'src/shared/copy/notifications'

// Types
import {Protoboard, Source, RemoteDataState} from 'src/types'
import {NextReturn} from 'src/types/wizard'

interface SelectedDashboard {
  [x: string]: boolean
}

interface State {
  searchTerm: string
  protoboards: Protoboard[]
  selected: SelectedDashboard
  suggestedProtoboards: Protoboard[]
  fetchingProtoboards: RemoteDataState
  fetchingSuggested: RemoteDataState
}

interface Props {
  notify: typeof notifyAction
  dashboardsCreated: Protoboard[]
  source: Source
  countSelected: (selectedDashboards: number) => void
}

@ErrorHandling
class DashboardStep extends Component<Props, State> {
  private isComponentMounted: boolean

  public constructor(props: Props) {
    super(props)
    this.state = {
      selected: this.selected,
      protoboards: [],
      searchTerm: '',
      suggestedProtoboards: [],
      fetchingProtoboards: RemoteDataState.NotStarted,
      fetchingSuggested: RemoteDataState.NotStarted,
    }
  }

  public async componentDidMount() {
    this.isComponentMounted = true

    this.setState({fetchingProtoboards: RemoteDataState.Loading})
    try {
      const protoboards = await getProtoboards()

      if (this.isComponentMounted) {
        this.setState({protoboards, fetchingProtoboards: RemoteDataState.Done})
        this.handleSuggest()
      }
    } catch (err) {
      if (this.isComponentMounted) {
        this.setState({fetchingProtoboards: RemoteDataState.Error})
      }
    }
  }

  public componentWillUnmount() {
    this.isComponentMounted = false
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
    const {protoboards, fetchingProtoboards} = this.state

    if (fetchingProtoboards === RemoteDataState.Loading) {
      return <PageSpinner />
    }

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

  private get selected(): SelectedDashboard {
    return this.props.dashboardsCreated.reduce(
      (acc, d) => ({...acc, [d.id]: true}),
      {}
    )
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
    const {
      selected,
      suggestedProtoboards,
      searchTerm,
      fetchingSuggested,
    } = this.state

    if (fetchingSuggested === RemoteDataState.Loading) {
      return (
        <div className="dashboard-step--loading">
          <PageSpinner />
        </div>
      )
    }

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
    const {source} = this.props

    if (source) {
      if (this.isComponentMounted) {
        this.setState({fetchingSuggested: RemoteDataState.Loading})
      }

      try {
        const suggestedProtoboardsList = await getSuggestedProtoboards(
          source,
          protoboards
        )

        if (suggestedProtoboardsList.length === 0) {
          if (this.isComponentMounted) {
            this.setState({
              fetchingSuggested: RemoteDataState.Done,
            })
          }
          return
        }

        const suggestedProtoboards = protoboards.filter(p =>
          suggestedProtoboardsList.includes(p.meta.name)
        )

        if (this.isComponentMounted) {
          this.setState({
            suggestedProtoboards,
            fetchingSuggested: RemoteDataState.Done,
          })
        }
      } catch (err) {
        this.setState({fetchingSuggested: RemoteDataState.Error})
      }
    }
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

export default connect(null, mdtp, null, {forwardRef: true})(DashboardStep)
