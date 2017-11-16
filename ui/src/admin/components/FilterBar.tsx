import * as React from 'react'

export interface FilterBarProps {
  onFilter: (filterText: string) => {}
  type: string
  isEditing: boolean
  onClickCreate: (type: string) => () => void
}

class FilterBar extends React.Component<FilterBarProps, {filterText: string}> {
  constructor(props: FilterBarProps) {
    super(props)

    this.state = {
      filterText: '',
    }
  }

  private handleFilter = text => () => {
    this.props.onFilter(text)
  }

  private handleText = e => {
    const {value: filterText} = e.target
    this.setState({filterText}, this.handleFilter(filterText))
  }

  public componentWillUnmount() {
    this.props.onFilter('')
  }

  public render() {
    const {type, isEditing, onClickCreate} = this.props
    const placeholderText = type.replace(/\w\S*/g, txt => {
      return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    })

    return (
      <div className="panel-heading u-flex u-ai-center u-jc-space-between">
        <div className="users__search-widget input-group admin__search-widget">
          <input
            type="text"
            className="form-control input-sm"
            placeholder={`Filter ${placeholderText}...`}
            value={this.state.filterText}
            onChange={this.handleText}
          />
          <div className="input-group-addon">
            <span className="icon search" aria-hidden="true" />
          </div>
        </div>
        <button
          className="btn btn-sm btn-primary"
          disabled={isEditing}
          onClick={onClickCreate(type)}
        >
          <span className="icon plus" /> Create{' '}
          {placeholderText.substring(0, placeholderText.length - 1)}
        </button>
      </div>
    )
  }
}

export default FilterBar
