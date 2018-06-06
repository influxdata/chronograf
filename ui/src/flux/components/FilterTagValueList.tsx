import React, {PureComponent, MouseEvent} from 'react'

import FilterTagValueListItem from 'src/flux/components/FilterTagValueListItem'
import LoadingSpinner from 'src/flux/components/LoadingSpinner'
import {Service, SchemaFilter} from 'src/types'

export type SetFilterTagValue = (
  key: string,
  value: string,
  selected: boolean
) => void

interface Props {
  service: Service
  db: string
  tagKey: string
  values: string[]
  changeValue: SetFilterTagValue
  filter: SchemaFilter[]
  isLoadingMoreValues: boolean
  onLoadMoreValues: () => void
  shouldShowMoreValues: boolean
  loadMoreCount: number
}

export default class FilterTagValueList extends PureComponent<Props> {
  public render() {
    const {values, tagKey, shouldShowMoreValues} = this.props

    return (
      <>
        {values.map((v, i) => (
          <FilterTagValueListItem
            key={i}
            value={v}
            tagKey={tagKey}
            changeValue={this.props.changeValue}
          />
        ))}
        {shouldShowMoreValues && (
          <div className="flux-schema-tree flux-tree-node">
            <div className="flux-schema-item no-hover">
              <button
                className="btn btn-xs btn-default increase-values-limit"
                onClick={this.handleClick}
              >
                {this.buttonValue}
              </button>
            </div>
          </div>
        )}
      </>
    )
  }

  private handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    this.props.onLoadMoreValues()
  }

  private get buttonValue(): string | JSX.Element {
    const {isLoadingMoreValues, loadMoreCount, tagKey} = this.props

    if (isLoadingMoreValues) {
      return <LoadingSpinner />
    }

    return `Load next ${loadMoreCount} values for ${tagKey}`
  }
}
