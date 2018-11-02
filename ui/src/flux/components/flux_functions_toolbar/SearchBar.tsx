import React, {PureComponent, ChangeEvent} from 'react'
import _ from 'lodash'

import {ErrorHandling} from 'src/shared/decorators/errors'

interface Props {
  onSearch: (s: string) => void
}
interface State {
  searchTerm: string
}

@ErrorHandling
class SearchBar extends PureComponent<Props, State> {
  constructor(props: Props) {
    super(props)

    this.state = {
      searchTerm: '',
    }
  }

  public componentWillMount() {
    const waitPeriod = 100
    this.handleSearch = _.debounce(this.handleSearch, waitPeriod)
  }

  public render() {
    return (
      <div className="flux-functions-toolbar--search">
        <div className="search-widget">
          <input
            type="text"
            className="form-control input-sm"
            placeholder="Filter Functions..."
            onChange={this.handleChange}
            value={this.state.searchTerm}
          />
          <span className="icon search" />
        </div>
      </div>
    )
  }

  private handleSearch = (): void => {
    this.props.onSearch(this.state.searchTerm)
  }

  private handleChange = (e: ChangeEvent<HTMLInputElement>): void => {
    this.setState({searchTerm: e.target.value}, this.handleSearch)
  }
}

export default SearchBar
