import React, {PureComponent} from 'react'
import _ from 'lodash'

import {SearchStatus} from 'src/types/logs'
import {LoadingMessages} from 'src/logs/constants'

interface Props {
  status: SearchStatus
}

class LoadingStatus extends PureComponent<Props> {
  public render() {
    return (
      <div className="logs-viewer--table-container generic-empty-state">
        <h4>{this.loadingMessage}...</h4>
        <p>{this.description}</p>
      </div>
    )
  }

  private randomLoadingDescription = (): string => {
    return _.sample(LoadingMessages)
  }

  private get description(): JSX.Element {
    switch (this.props.status) {
      case SearchStatus.NoResults:
        return (
          <>
            Try changing the <strong>time range</strong> or
            <strong>removing filters</strong>
          </>
        )
      default:
        return <>{this.randomLoadingDescription}</>
    }
  }

  private get loadingMessage(): string {
    switch (this.props.status) {
      case SearchStatus.Loading:
        return 'Searching'
      case SearchStatus.UpdatingFilters:
        return 'Updating Search Filters'
      case SearchStatus.NoResults:
        return 'No logs to display'
      case SearchStatus.UpdatingTimeBounds:
        return 'Searching time bounds'
    }
  }
}

export default LoadingStatus
