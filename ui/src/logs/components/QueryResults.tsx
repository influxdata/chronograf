import React, {PureComponent} from 'react'
import moment from 'moment'
import {SearchStatus} from 'src/types/logs'

const QUERY_RESULTS_TIME_FORMAT = 'MMM D, YYYY @HH:mm:ss'

interface Props {
  count: number
  queryCount: number
  isInsideHistogram?: boolean
  searchStatus: SearchStatus
  upper?: number | undefined
  lower?: number | undefined
}

class QueryResults extends PureComponent<Props> {
  public static defaultProps: Partial<Props> = {
    isInsideHistogram: false,
  }

  public render() {
    return (
      <label className="logs-viewer--results-text">
        {this.isPending ? this.pendingContents : this.completedContents}
      </label>
    )
  }

  private get isPending(): boolean {
    return this.props.searchStatus !== SearchStatus.Loaded
  }

  private get pendingContents(): JSX.Element {
    if (this.props.isInsideHistogram) {
      return <>Updating Histogram...</>
    }

    return (
      <>
        Querying back to
        <br />
        {this.formattedUpperTime}...
      </>
    )
  }

  private get completedContents(): JSX.Element {
    if (this.props.isInsideHistogram) {
      return (
        <>
          Displaying <strong> {this.props.count} Events</strong> in Histogram
        </>
      )
    }

    return (
      <>
        {this.eventContents}
        {this.rangeContents}
      </>
    )
  }

  private get eventContents(): JSX.Element {
    return (
      <>
        Query returned <strong>{this.props.count} Events</strong> <br />
      </>
    )
  }

  private get rangeContents(): JSX.Element {
    if (this.props.upper === undefined || this.props.lower === undefined) {
      return null
    }

    return (
      <>
        <span>
          Newest: <strong>{this.formattedUpperTime}</strong>
        </span>
        <br />
        <span>
          Oldest: <strong>{this.formattedLowerTime}</strong>
        </span>
      </>
    )
  }

  private get formattedLowerTime(): string {
    return moment(this.props.lower).format(QUERY_RESULTS_TIME_FORMAT)
  }

  private get formattedUpperTime(): string {
    return moment(this.props.upper).format(QUERY_RESULTS_TIME_FORMAT)
  }
}

export default QueryResults
