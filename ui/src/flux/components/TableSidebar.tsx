import React, {PureComponent, ChangeEvent} from 'react'
import _ from 'lodash'

import {FluxTable} from 'src/types'
import {ErrorHandling} from 'src/shared/decorators/errors'
import FancyScrollbar from 'src/shared/components/FancyScrollbar'
import TableSidebarItem from 'src/flux/components/TableSidebarItem'

interface Props {
  data: FluxTable[]
  selectedResultName: string
  onSelectResult: (id: string) => void
}

interface State {
  searchTerm: string
}

@ErrorHandling
export default class TableSidebar extends PureComponent<Props, State> {
  constructor(props) {
    super(props)

    this.state = {
      searchTerm: '',
    }
  }

  public render() {
    const {selectedResultName, onSelectResult} = this.props
    const {searchTerm} = this.state

    return (
      <div className="time-machine-sidebar">
        {!this.isDataEmpty && (
          <div className="time-machine-sidebar--heading">
            <input
              type="text"
              className="form-control input-xs time-machine-sidebar--filter"
              onChange={this.handleSearch}
              placeholder="Filter tables"
              value={searchTerm}
            />
          </div>
        )}
        <FancyScrollbar>
          <div className="time-machine-sidebar--items">
            {this.data.map(({groupKey, id, name}) => {
              return (
                <TableSidebarItem
                  id={id}
                  key={id}
                  name={name}
                  groupKey={groupKey}
                  onSelect={onSelectResult}
                  isSelected={name === selectedResultName}
                />
              )
            })}
          </div>
        </FancyScrollbar>
      </div>
    )
  }

  private handleSearch = (e: ChangeEvent<HTMLInputElement>) => {
    this.setState({searchTerm: e.target.value})
  }

  get data(): FluxTable[] {
    const {data} = this.props
    const {searchTerm} = this.state

    return data.filter(d => d.name.includes(searchTerm))
  }

  get isDataEmpty(): boolean {
    return _.isEmpty(this.props.data)
  }
}
