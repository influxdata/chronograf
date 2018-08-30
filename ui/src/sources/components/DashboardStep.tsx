// Libraries
import React, {Component} from 'react'

// APIs
import {getProtoBoards} from 'src/sources/apis'

// Decorators
import {ErrorHandling} from 'src/shared/decorators/errors'

// Utils
import {isSearchMatch} from 'src/utils/searchMatch'

// Components
import GridSizer from 'src/reusable_ui/components/grid_sizer/GridSizer'
import CardSelectCard from 'src/reusable_ui/components/card_select/CardSelectCard'
import SearchBar from 'src/hosts/components/SearchBar'

// Types
import {Protoboard} from 'src/types'

interface State {
  selected: object
  searchTerm: string
  protoboards: Protoboard[]
}

@ErrorHandling
class DashboardStep extends Component<{}, State> {
  public constructor(props) {
    super(props)
    this.state = {
      selected: {},
      protoboards: [],
      searchTerm: '',
    }
  }

  public async componentDidMount() {
    const protoboards = await getProtoBoards()
    this.setState({protoboards})
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
          <GridSizer>{this.dashboardCards}</GridSizer>
        </div>
      )
    }
    return <div />
  }

  private setSearchTerm = searchTerm => {
    this.setState({searchTerm})
  }

  private get dashboardCards() {
    const {selected, protoboards, searchTerm} = this.state
    const filteredProtoboards = protoboards.filter(pb =>
      isSearchMatch(pb.meta.name, searchTerm)
    )
    return filteredProtoboards.map((protoboard, i) => {
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
