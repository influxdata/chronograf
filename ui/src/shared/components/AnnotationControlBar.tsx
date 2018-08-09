import React, {PureComponent} from 'react'
import {connect} from 'react-redux'

import AddAnnotationToggle from 'src/shared/components/AddAnnotationToggle'
import AnnotationFilterControl from 'src/shared/components/AnnotationFilterControl'
import {Button, ComponentColor, ButtonShape, IconFont} from 'src/reusable_ui'

import {
  updateTagFilter,
  deleteTagFilter,
  fetchAndSetTagKeys,
  fetchAndSetTagValues,
} from 'src/shared/actions/annotations'

import {NEW_TAG_FILTER} from 'src/shared/annotations/helpers'
import {getTagFilters} from 'src/shared/selectors/annotations'

import {Source} from 'src/types'
import {TagFilter} from 'src/types/annotations'
import {AnnotationState} from 'src/shared/reducers/annotations'

interface Props {
  dashboardID: number
  tagFilters: TagFilter[]
  tagKeys?: string[]
  tagValues: {
    [tagKey: string]: string[]
  }
  source: Source
  onUpdateTagFilter: typeof updateTagFilter
  onDeleteTagFilter: typeof deleteTagFilter
  onRefreshAnnotations: () => Promise<void>
  onGetTagKeys: typeof fetchAndSetTagKeys
  onGetTagValues: typeof fetchAndSetTagValues
}

class AnnotationControlBar extends PureComponent<Props> {
  public render() {
    const {tagFilters} = this.props

    return (
      <div className="annotation-control-bar">
        <div className="annotation-control-bar--lhs">
          <div className="toolbar-title">Filter Annotations by Tags:</div>
          {tagFilters.map(tagFilter => (
            <AnnotationFilterControl
              key={tagFilter.id}
              tagFilter={tagFilter}
              onUpdate={this.handleUpdateTagFilter}
              onDelete={this.handleDeleteTagFilter}
              onGetKeySuggestions={this.handleGetKeySuggestions}
              onGetValueSuggestions={this.handleGetValueSuggestions}
            />
          ))}
          <Button
            onClick={this.handleAddTagFilter}
            icon={IconFont.Plus}
            shape={ButtonShape.Square}
            color={ComponentColor.Primary}
          />
        </div>
        <div className="annotation-control-bar--rhs">
          <AddAnnotationToggle />
        </div>
      </div>
    )
  }

  private handleAddTagFilter = () => {
    const {onUpdateTagFilter, dashboardID} = this.props

    onUpdateTagFilter(dashboardID, NEW_TAG_FILTER())
  }

  private handleUpdateTagFilter = async (t: TagFilter): Promise<void> => {
    const {dashboardID, onUpdateTagFilter, onRefreshAnnotations} = this.props

    onUpdateTagFilter(dashboardID, t)
    await onRefreshAnnotations()
  }

  private handleDeleteTagFilter = async (t: TagFilter): Promise<void> => {
    const {dashboardID, onDeleteTagFilter, onRefreshAnnotations} = this.props

    onDeleteTagFilter(dashboardID, t)
    await onRefreshAnnotations()
  }

  private handleGetKeySuggestions = async (): Promise<string[]> => {
    const {tagKeys, onGetTagKeys, source} = this.props

    if (!!tagKeys) {
      return tagKeys
    }

    await onGetTagKeys(source.links.proxy)

    return this.props.tagKeys
  }

  private handleGetValueSuggestions = async (
    tagKey: string
  ): Promise<string[]> => {
    const {tagValues, onGetTagValues, source} = this.props

    if (!!tagValues[tagKey]) {
      return tagValues[tagKey]
    }

    await onGetTagValues(source.links.proxy, tagKey)

    return this.props.tagValues[tagKey]
  }
}

const mstp = (
  state: {annotations: AnnotationState},
  ownProps: {dashboardID: number}
): Partial<Props> => {
  const {tagKeys, tagValues} = state.annotations
  const tagFilters = getTagFilters(state, ownProps.dashboardID)

  return {tagFilters, tagKeys, tagValues}
}

const mdtp = {
  onUpdateTagFilter: updateTagFilter,
  onDeleteTagFilter: deleteTagFilter,
  onGetTagKeys: fetchAndSetTagKeys,
  onGetTagValues: fetchAndSetTagValues,
}

export default connect(mstp, mdtp)(AnnotationControlBar)
