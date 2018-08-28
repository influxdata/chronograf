import React, {PureComponent} from 'react'
import moment from 'moment'
import {SearchStatus} from 'src/types/logs'

interface Props {
  count: number
  queryCount: number
  searchStatus: SearchStatus
  nextOlderUpperBound: string
}

class QueryResults extends PureComponent<Props> {
  public render() {
    const {count, nextOlderUpperBound} = this.props
    const formattedTime = moment(nextOlderUpperBound).format(
      'MMM D, YYYY @HH:mm:ss'
    )

    let contents = (
      <>
        Query returned <strong>{count} Events</strong> <br />
        Querying back to {formattedTime}...
      </>
    )

    if (this.isPending) {
      contents = (
        <>
          Querying back to
          <br />
          {formattedTime}...
        </>
      )
    }

    return <label className="logs-viewer--results-text">{contents}</label>
  }

  private get isPending(): boolean {
    return this.props.searchStatus !== SearchStatus.Loaded
  }
}

export default QueryResults
