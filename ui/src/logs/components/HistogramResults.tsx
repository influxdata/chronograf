import React, {PureComponent} from 'react'
import {SearchStatus} from 'src/types/logs'

interface Props {
  count: number
  queryCount: number
  searchStatus: SearchStatus
  windowOption: string
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
        No results in past <strong>{this.props.windowOption}</strong>
      </>
    )
  }
}

export default HistogramResults
