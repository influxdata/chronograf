import React, {PureComponent} from 'react'
import {SearchStatus, TimeRange} from 'src/types/logs'

interface Props {
  count: number
  queryCount: number
  searchStatus: SearchStatus
  selectedTimeWindow: TimeRange
}

class HistogramResults extends PureComponent<Props> {
  public render() {
    return <label className="logs-viewer--results-text">{this.contents}</label>
  }

  private get contents() {
    switch (this.props.searchStatus) {
      case SearchStatus.NoResults:
        return this.noResultsContent
      case SearchStatus.Loaded:
        return this.completedContents
      default:
        return <>Updating histogram...</>
    }
  }

  private get completedContents(): JSX.Element {
    const {count} = this.props

    if (count === 0) {
      return this.noResultsContent
    }

    return (
      <>
        Displaying <strong> {count} events</strong> in histogram
      </>
    )
  }

  private get noResultsContent(): JSX.Element {
    return (
      <>
        No results in <strong>{this.window}</strong>
      </>
    )
  }

  private get window(): string {
    const {timeOption, windowOption} = this.props.selectedTimeWindow

    if (timeOption === 'now') {
      return `Past ${windowOption}`
    }

    return `${windowOption} Window`
  }
}

export default HistogramResults
