import React, {PureComponent} from 'react'
import moment from 'moment'
import {SearchStatus} from 'src/types/logs'

interface Props {
  count: number
  queryCount: number
  searchStatus: SearchStatus
  nextOlderUpperBound: string
  nextNewerLowerBound: number
}

class QueryResults extends PureComponent<Props> {
  public render() {
    const {count, nextOlderUpperBound, nextNewerLowerBound} = this.props
    const formattedLowerTime = moment(nextNewerLowerBound).format(
      'MMM D, YYYY @HH:mm:ss'
    )

    const formattedUpperTime = moment(nextOlderUpperBound).format(
      'MMM D, YYYY @HH:mm:ss'
    )

    let contents = (
      <>
        Query returned <strong>{count} Events</strong> <br />
        From: <strong>{formattedLowerTime}</strong> <br />
        To: <strong>{formattedUpperTime}</strong>...
      </>
    )

    if (this.isPending) {
      contents = (
        <>
          Querying back to
          <br />
          {formattedUpperTime}...
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
