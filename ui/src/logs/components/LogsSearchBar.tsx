import React, {PureComponent, ChangeEvent, KeyboardEvent} from 'react'

import {Input, IconFont, Button, ComponentColor} from 'src/reusable_ui'

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
          <Input
            icon={IconFont.Search}
            placeholder="Search logs using keywords or regular expressions..."
            onChange={this.handleChange}
            onKeyDown={this.handleInputKeyDown}
            value={searchTerm}
          />
        </div>
        <Button
          text="Search"
          color={ComponentColor.Primary}
          onClick={this.handleSearch}
        />
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
