import React, {PureComponent} from 'react'

interface Props {
  count: number
  queryCount: number
  isInsideHistogram?: boolean
}

class QueryResults extends PureComponent<Props> {
  public static defaultProps: Partial<Props> = {
    isInsideHistogram: false,
  }

  public render() {
    const {count, isInsideHistogram} = this.props

    let contents = (
      <>
        Query returned <strong>{count} Events</strong>
      </>
    )

    if (isInsideHistogram) {
      contents = (
        <>
          Displaying <strong>{count} Events</strong> in Histogram
        </>
      )
    }

    if (this.isPending) {
      contents = <>Querying...</>
    }

    if (this.isPending && isInsideHistogram) {
      contents = <>Updating Histogram...</>
    }

    return <label className="logs-viewer--results-text">{contents}</label>
  }

  private get isPending(): boolean {
    const {queryCount} = this.props
    return queryCount > 0
  }
}

export default QueryResults
