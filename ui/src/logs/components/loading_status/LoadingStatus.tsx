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
        {this.loadingSpinner}
        <h4>
          {this.loadingMessage} {this.description}
        </h4>
      </div>
    )
  }

  private get description(): JSX.Element {
    switch (this.props.status) {
      case SearchStatus.NoResults:
        return (
          <>
            Try changing the <strong>Time Range</strong> or{' '}
            <strong>Removing Filters</strong>
          </>
        )
      case SearchStatus.MeasurementMissing:
        return (
          <>
            Try changing the selected <strong>Database</strong> or{' '}
            <strong>Source</strong>
          </>
        )
      default:
        return <>{this.timeBounds}</>
    }
  }

  private get loadingSpinner(): JSX.Element {
    switch (this.props.status) {
      case SearchStatus.NoResults:
      case SearchStatus.MeasurementMissing:
        return (
          <div className="logs-viewer--search-graphic">
            <div className="logs-viewer--graphic-empty" />
          </div>
        )
      case SearchStatus.UpdatingFilters:
      case SearchStatus.UpdatingTimeBounds:
      case SearchStatus.UpdatingSource:
      case SearchStatus.UpdatingNamespace:
      case SearchStatus.Loading:
        return (
          <div className="logs-viewer--search-graphic">
            <div className="logs-viewer--graphic-log" />
            <div className="logs-viewer--graphic-magnifier-a">
              <div className="logs-viewer--graphic-magnifier-b" />
            </div>
          </div>
        )
      default:
        return null
    }
  }

  private get timeBounds(): JSX.Element {
    return (
      <div className="logs-viewer--searching-time">
        from <strong>{formatTime(this.props.upper)}</strong> to{' '}
        <strong>{formatTime(this.props.lower)}</strong>
      </div>
    )
  }

  private get loadingMessage(): string | JSX.Element {
    switch (this.props.status) {
      case SearchStatus.UpdatingFilters:
        return 'Updating search filters...'
      case SearchStatus.NoResults:
        return 'No logs found'
      case SearchStatus.UpdatingTimeBounds:
        return 'Searching time bounds...'
      case SearchStatus.UpdatingSource:
        return 'Searching updated source...'
      case SearchStatus.UpdatingNamespace:
        return 'Searching updated namespace...'
      case SearchStatus.MeasurementMissing:
        return (
          <>
            The selected database does not have a <strong>syslog</strong>{' '}
            measurement...<br />
          </>
        )
      case SearchStatus.Loading:
      default:
        return 'Searching...'
    }
  }
}

export default LoadingStatus
