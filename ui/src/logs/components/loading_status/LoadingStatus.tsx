import React, {PureComponent} from 'react'

import {SearchStatus} from 'src/types/logs'
import {formatTime} from 'src/logs/utils'

interface Props {
  status: SearchStatus
  lower: number
  upper: number
}

class LoadingStatus extends PureComponent<Props> {
  public render() {
    return (
      <div className="logs-viewer--table-container generic-empty-state">
        <h4>
          {this.loadingMessage} {this.description}...
        </h4>
      </div>
    )
  }

  private get description(): JSX.Element {
    switch (this.props.status) {
      case SearchStatus.NoResults:
        return (
          <>
            Try changing the <strong>time range</strong> or{' '}
            <strong>removing filters</strong>
          </>
        )
      default:
        return <>{this.timeBounds}</>
    }
  }

  private get timeBounds(): JSX.Element {
    return (
      <>
        <strong>from</strong> {formatTime(this.props.upper)} <strong>to</strong>{' '}
        {formatTime(this.props.lower)}
      </>
    )
  }

  private get loadingMessage(): string {
    switch (this.props.status) {
      case SearchStatus.UpdatingFilters:
        return 'Updating search filters'
      case SearchStatus.NoResults:
        return 'No logs found'
      case SearchStatus.UpdatingTimeBounds:
        return 'Searching time bounds'
      case SearchStatus.UpdatingSource:
        return 'Searching updated source'
      case SearchStatus.UpdatingNamespace:
        return 'Searching updated namespace'
      case SearchStatus.Loading:
      default:
        return 'Searching'
    }
  }
}

export default LoadingStatus
