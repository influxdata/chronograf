import React, {PureComponent} from 'react'
import QueryMakerTab from 'src/data_explorer/components/QueryMakerTab'
import buildInfluxQLQuery from 'src/utils/influxql'
import {QueryConfig, TimeRange} from 'src/types/queries'
import {Button, ButtonShape, ComponentColor, IconFont} from 'src/reusable_ui'

interface Props {
  queries: QueryConfig[]
  onAddQuery: () => void
  onDeleteQuery: (index: number) => void
  onToggleQueryVisibility: (index: number) => void
  activeQueryIndex: number
  setActiveQueryIndex: (index: number) => void
  timeRange: TimeRange
}

export default class QueryTabList extends PureComponent<Props> {
  public render() {
    const {
      queries,
      onAddQuery,
      onDeleteQuery,
      activeQueryIndex,
      setActiveQueryIndex,
      onToggleQueryVisibility,
    } = this.props

    return (
      <div className="query-maker--tabs">
        {queries.map((q, i) => (
          <QueryMakerTab
            key={i}
            isActive={i === activeQueryIndex}
            isVisible={q.isQueryVisible}
            query={q}
            onSelect={setActiveQueryIndex}
            onDelete={onDeleteQuery}
            onToggleVisbility={onToggleQueryVisibility}
            queryTabText={this.queryTabText(i, q)}
            queryIndex={i}
          />
        ))}
        <Button
          customClass="query-maker--new-tab"
          titleText="Create a new blank query"
          icon={IconFont.Plus}
          color={ComponentColor.Primary}
          shape={ButtonShape.Square}
          onClick={onAddQuery}
        />
      </div>
    )
  }

  private queryTabText = (i: number, query: QueryConfig): string => {
    const {timeRange} = this.props

    return (
      query.rawText || buildInfluxQLQuery(timeRange, query) || `Query ${i + 1}`
    )
  }
}
