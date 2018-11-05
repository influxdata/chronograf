// Libraries
import React, {PureComponent, ChangeEvent} from 'react'
import _ from 'lodash'

// Components
import {Input, IconFont} from 'src/reusable_ui'

// Types
import {InputType} from 'src/reusable_ui/components/inputs/Input'

// Decorators
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

  public componentDidMount() {
    const waitPeriod = 100
    this.handleSearch = _.debounce(this.handleSearch, waitPeriod)
  }

  public render() {
    return (
      <div className="flux-functions-toolbar--search">
        <Input
          type={InputType.Text}
          icon={IconFont.Search}
          placeholder="Filter Functions..."
          onChange={this.handleChange}
          value={this.state.searchTerm}
        />
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
