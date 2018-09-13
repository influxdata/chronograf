import React, {PureComponent} from 'react'
import _ from 'lodash'
import moment from 'moment'

import {SearchStatus} from 'src/types/logs'
import {LoadingMessages} from 'src/logs/constants'

interface Props {
  status: SearchStatus
  currentOlderLowerBound: number
}

class LoadingStatus extends PureComponent<Props> {
  public render() {
    const {currentOlderLowerBound} = this.props
    const loadingTime = moment(currentOlderLowerBound).fromNow()

    return (
      <div className="logs-viewer--table-container generic-empty-state">
        <h4>
          {this.loadingMessage}: ({loadingTime})
        </h4>
        <p>{this.description}</p>
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
        return <>{this.randomLoadingDescription}</>
    }
  }

  private get randomLoadingDescription(): string {
    return _.sample(LoadingMessages)
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
