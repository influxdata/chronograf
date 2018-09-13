import React, {PureComponent} from 'react'
import {SearchStatus} from 'src/types/logs'

interface Props {
  count: number
  queryCount: number
  searchStatus: SearchStatus
}

class HistogramResults extends PureComponent<Props> {
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
    return <>Updating Histogram...</>
  }

  private get completedContents(): JSX.Element {
    return (
      <>
        Displaying <strong> {this.props.count} Events</strong> in Histogram
      </>
    )
  }
}

export default HistogramResults
