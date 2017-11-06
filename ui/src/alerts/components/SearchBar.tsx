import * as React from 'react'
import * as _ from 'lodash'

export interface SearchBarProps {
  onSearch: (term: string) => void
}

export interface SearchBarState {
  searchTerm: string
}

class SearchBar extends React.Component<SearchBarProps, SearchBarState> {
  constructor(props: SearchBarProps) {
    super(props)

    this.state = {
      searchTerm: '',
    }
  }

  private handleSearch = () => {
    this.props.onSearch(this.state.searchTerm)
  }

  private handleChange = e => {
    this.setState({searchTerm: e.target.value}, this.handleSearch)
  }

  public componentWillMount() {
    const waitPeriod = 300
    this.handleSearch = _.debounce(this.handleSearch, waitPeriod)
  }

  public render() {
    return (
      <div className="users__search-widget input-group">
        <input
          type="text"
          className="form-control"
          placeholder="Filter Alerts..."
          onChange={this.handleChange}
          value={this.state.searchTerm}
        />
        <div className="input-group-addon">
          <span className="icon search" />
        </div>
      </div>
    )
  }
}

export default SearchBar
