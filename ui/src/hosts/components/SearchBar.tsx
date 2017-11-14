import * as React from 'react'
import * as _ from 'lodash'

export interface SearchBarProps {
  onSearch: (term: string) => void
}

export interface SearchBarState {
  searchTerm: string
}

class SearchBar extends React.Component<SearchBarProps, SearchBarState> {
  private searchInput: HTMLInputElement

  public state = {
    searchTerm: '',
  }

  private handleSearch = () => {
    this.props.onSearch(this.state.searchTerm)
  }

  private handleChange = () => {
    this.setState({searchTerm: this.searchInput.value}, this.handleSearch)
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
          placeholder="Filter by Host..."
          ref={r => (this.searchInput = r)}
          onChange={this.handleChange}
        />
        <div className="input-group-addon">
          <span className="icon search" aria-hidden="true" />
        </div>
      </div>
    )
  }
}

export default SearchBar
