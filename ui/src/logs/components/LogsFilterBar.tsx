import React, {PureComponent} from 'react'
import {Filter} from 'src/types/logs'
import FilterBlock from 'src/logs/components/LogsFilter'
import {Button, ComponentSize} from 'src/reusable_ui'

interface Props {
  filters: Filter[]
  onDelete: (id: string) => void
  onClearFilters: () => void
  onFilterChange: (id: string, operator: string, value: string) => void
}

class LogsFilters extends PureComponent<Props> {
  public render() {
    return (
      <div className="logs-viewer--filter-bar">
        <div className="logs-viewer--filters">{this.renderFilters}</div>
        {this.clearFiltersButton}
      </div>
    )
  }

  private get clearFiltersButton(): JSX.Element {
    const {filters, onClearFilters} = this.props

    if (filters.length >= 3) {
      return (
        <div className="logs-viewer--clear-filters">
          <Button
            size={ComponentSize.Small}
            text="Clear Filters"
            onClick={onClearFilters}
          />
        </div>
      )
    }
  }

  private get renderFilters(): JSX.Element[] {
    const {filters} = this.props

    return filters.map(filter => (
      <FilterBlock
        key={filter.id}
        filter={filter}
        onDelete={this.props.onDelete}
        onChangeFilter={this.props.onFilterChange}
      />
    ))
  }
}

export default LogsFilters
