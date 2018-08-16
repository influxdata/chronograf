import React, {PureComponent, ChangeEvent, KeyboardEvent} from 'react'

interface Props {
  onSearch: (value: string) => void
}

interface State {
  searchTerm: string
}

class LogsSearchBar extends PureComponent<Props, State> {
  constructor(props: Props) {
    super(props)

    this.state = {
      searchTerm: '',
    }
  }

  public render() {
    const {searchTerm} = this.state

    return (
      <div className="logs-viewer--search-bar">
        <div className="logs-viewer--search-input">
          <input
            className="form-control input-sm"
            type="text"
            placeholder="Search logs using keywords or regular expressions..."
            value={searchTerm}
            onChange={this.handleChange}
            onKeyDown={this.handleInputKeyDown}
            spellCheck={false}
            autoComplete="off"
          />
          <span className="icon search" />
        </div>
        <div className="btn btn-sm btn-primary" onClick={this.handleSearch}>
          Search
        </div>
      </div>
    )
  }

  private handleSearch = () => {
    this.props.onSearch(this.state.searchTerm)
    this.setState({searchTerm: ''})
  }

  private handleInputKeyDown = (e: KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') {
      return this.handleSearch()
    }
  }

  private handleChange = (e: ChangeEvent<HTMLInputElement>): void => {
    this.setState({searchTerm: e.target.value})
  }
}

export default LogsSearchBar
