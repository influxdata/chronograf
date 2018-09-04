// Libraries
import React, {PureComponent, ChangeEvent} from 'react'
import _ from 'lodash'

// Decorators
import {ErrorHandling} from 'src/shared/decorators/errors'

interface Props {
  width?: number
  placeholder: string
  onSearch: (searchTerm: string) => void
}

interface State {
  searchTerm: string
}

@ErrorHandling
class SearchBar extends PureComponent<Props, State> {
  public static defaultProps: Partial<Props> = {
    width: 260,
  }

  public debouncedHandleSearch: () => void

  constructor(props: Props) {
    super(props)
    this.state = {
      searchTerm: '',
    }
  }

  public componentWillMount() {
    this.debouncedHandleSearch = _.debounce(this.handleSearch, 50)
  }

  public render() {
    const {placeholder, width} = this.props
    return (
      <div className="search-widget" style={{width: `${width}px`}}>
        <input
          type="text"
          className="form-control input-sm"
          placeholder={placeholder}
          onChange={this.handleChange}
        />
        <span className="icon search" />
      </div>
    )
  }

  private handleSearch = () => {
    this.props.onSearch(this.state.searchTerm)
  }

  private handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    this.setState({searchTerm: e.target.value}, this.debouncedHandleSearch)
  }
}

export default SearchBar
