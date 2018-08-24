import React, {PureComponent} from 'react'

interface Props {
  count: number
  queryCount: number
}

class QueryResults extends PureComponent<Props> {
  public render() {
    const {count} = this.props

    let contents = (
      <>
        Query returned <strong>{count} Events</strong>
      </>
    )

    if (this.isPending) {
      contents = <>Querying...</>
    }

    return <label className="logs-viewer--results-text">{contents}</label>
  }

  private get isPending(): boolean {
    const {queryCount} = this.props
    return queryCount > 0
  }
}

export default QueryResults
