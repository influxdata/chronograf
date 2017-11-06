import * as React from 'react'
import * as PropTypes from 'prop-types'
import * as _ from 'lodash'

class SearchBar extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      searchTerm: '',
    }
  }

  componentWillMount() {
    const waitPeriod = 300
    this.handleSearch = _.debounce(this.handleSearch, waitPeriod)
  }

  handleSearch = () => {
    this.props.onSearch(this.state.searchTerm)
  }

  handleChange = () => {
    this.setState({searchTerm: this.refs.searchInput.value}, this.handleSearch)
  }

  render() {
    return (
      <div className="users__search-widget input-group">
        <input
          type="text"
          className="form-control"
          placeholder="Filter by Host..."
          ref="searchInput"
          onChange={this.handleChange}
        />
        <div className="input-group-addon">
          <span className="icon search" aria-hidden="true" />
        </div>
      </div>
    )
  }
}

const {func} = PropTypes

SearchBar.propTypes = {
  onSearch: func.isRequired,
}

export default SearchBar
