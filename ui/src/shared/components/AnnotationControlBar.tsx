import React, {PureComponent} from 'react'
import {connect, ResolveThunks} from 'react-redux'

import AddAnnotationToggle from 'src/shared/components/AddAnnotationToggle'
import AnnotationFilterControl from 'src/shared/components/AnnotationFilterControl'
import AnnotationsDisplaySettingDropdown from 'src/shared/components/AnnotationsDisplaySettingDropdown'
import {Button, ComponentColor, IconFont} from 'src/reusable_ui'

import {
  updateTagFilter,
  updateTagFilterAsync,
  deleteTagFilterAsync,
  fetchAndSetTagKeys,
  fetchAndSetTagValues,
} from 'src/shared/actions/annotations'

import {NEW_TAG_FILTER} from 'src/shared/annotations/helpers'
import {getTagFilters} from 'src/shared/selectors/annotations'

import {Source} from 'src/types'
import {TagFilter, AnnotationsDisplaySetting} from 'src/types/annotations'
import {AnnotationState} from 'src/shared/reducers/annotations'

interface ReduxStateProps {
  tagFilters: TagFilter[]
  tagKeys?: string[]
  tagValues: {
    [tagKey: string]: string[]
  }
  displaySetting: AnnotationsDisplaySetting
}
type ReduxDispatchProps = ResolveThunks<{
  onUpdateTagFilter: typeof updateTagFilter
  onUpdateTagFilterAsync: typeof updateTagFilterAsync
  onDeleteTagFilterAsync: typeof deleteTagFilterAsync
  onGetTagKeys: typeof fetchAndSetTagKeys
  onGetTagValues: typeof fetchAndSetTagValues
}>

interface OwnProps {
  dashboardID: string
  source: Source
}
type Props = OwnProps & ReduxStateProps & ReduxDispatchProps

class AnnotationControlBar extends PureComponent<Props> {
  public render() {
    const {tagFilters, displaySetting} = this.props

    return (
      <div className="annotation-control-bar">
        <div className="annotation-control-bar--lhs">
          <AnnotationsDisplaySettingDropdown />
          {displaySetting ===
            AnnotationsDisplaySetting.FilterAnnotationsByTag && (
            <>
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
                color={ComponentColor.Primary}
                text={'Filter'}
                titleText={'Add New Annotation Tag Filter'}
                dataTest={'add-annotation-filter--button'}
              />
            </>
          )}
        </div>
        <div className="annotation-control-bar--rhs">
          <AddAnnotationToggle />
        </div>
      </div>
    )
  }

  private handleAddTagFilter = async (): Promise<void> => {
    const {dashboardID, onUpdateTagFilter} = this.props

    await onUpdateTagFilter(dashboardID, NEW_TAG_FILTER())
  }

  private handleUpdateTagFilter = async (t: TagFilter): Promise<void> => {
    const {source, dashboardID, onUpdateTagFilterAsync} = this.props

    await onUpdateTagFilterAsync(source.links.annotations, dashboardID, t)
  }

  private handleDeleteTagFilter = async (t: TagFilter): Promise<void> => {
    const {source, dashboardID, onDeleteTagFilterAsync} = this.props

    await onDeleteTagFilterAsync(source.links.annotations, dashboardID, t)
  }

  private handleGetKeySuggestions = async (): Promise<string[]> => {
    const {tagKeys, onGetTagKeys, source} = this.props

    if (tagKeys) {
      return tagKeys
    }

    await onGetTagKeys(source.links.proxy)

    return this.props.tagKeys
  }

  private handleGetValueSuggestions = async (
    tagKey: string
  ): Promise<string[]> => {
    const {tagValues, onGetTagValues, source} = this.props

    if (tagValues[tagKey]) {
      return tagValues[tagKey]
    }

    await onGetTagValues(source.links.proxy, tagKey)

    return this.props.tagValues[tagKey]
  }
}

const mstp = (
  state: {annotations: AnnotationState},
  ownProps: {dashboardID: string}
): ReduxStateProps => {
  const {tagKeys, tagValues, displaySetting} = state.annotations
  const tagFilters = getTagFilters(state, ownProps.dashboardID)

  return {tagFilters, tagKeys, tagValues, displaySetting}
}

const mdtp = {
  onUpdateTagFilter: updateTagFilter,
  onUpdateTagFilterAsync: updateTagFilterAsync,
  onDeleteTagFilterAsync: deleteTagFilterAsync,
  onGetTagKeys: fetchAndSetTagKeys,
  onGetTagValues: fetchAndSetTagValues,
}

export default connect(mstp, mdtp)(AnnotationControlBar)
