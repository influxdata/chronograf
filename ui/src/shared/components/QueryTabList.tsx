import React, {PureComponent} from 'react'
import QueryMakerTab from 'src/data_explorer/components/QueryMakerTab'
import {
  Button,
  ComponentSize,
  ComponentColor,
  ButtonShape,
  IconFont,
} from 'src/reusable_ui'
import buildInfluxQLQuery from 'src/utils/influxql'
import {QueryConfig, TimeRange} from 'src/types/queries'

interface Props {
  queries: QueryConfig[]
  onAddQuery: () => void
  onDeleteQuery: (index: number) => void
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
    } = this.props

    return (
      <div className="query-maker--tabs">
        {queries.map((q, i) => (
          <QueryMakerTab
            key={i}
            isActive={i === activeQueryIndex}
            query={q}
            onSelect={setActiveQueryIndex}
            onDelete={onDeleteQuery}
            queryTabText={this.queryTabText(i, q)}
            queryIndex={i}
          />
        ))}
        <Button
          size={ComponentSize.ExtraSmall}
          color={ComponentColor.Primary}
          customClass="query-maker--new"
          icon={IconFont.PlusSkinny}
          onClick={onAddQuery}
          shape={ButtonShape.Square}
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
