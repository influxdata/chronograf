import React, {PureComponent} from 'react'

import {FILTER_TYPES} from 'src/shared/annotations/helpers'
import AnnotationFilterControlInput from 'src/shared/components/AnnotationFilterControlInput'
import {
  Button,
  ButtonShape,
  ComponentStatus,
  ComponentColor,
  ComponentSize,
  IconFont,
} from 'src/reusable_ui'

import {TagFilter, TagFilterType} from 'src/types/annotations'

const nextItem = (xs, x) => xs[(xs.indexOf(x) + 1) % xs.length]

type DraftState = 'SAVING' | 'EDITING' | 'DEFAULT'

interface Props {
  tagFilter: TagFilter
  onUpdate: (t: TagFilter) => Promise<void>
  onDelete: (t: TagFilter) => Promise<void>
  onGetKeySuggestions: () => Promise<string[]>
  onGetValueSuggestions: (key: string) => Promise<string[]>
}

interface State {
  tagKey: string
  tagValue: string
  filterType: TagFilterType
  keySuggestions: string[]
  valueSuggestions: string[]
  draftState: DraftState
}

class AnnotationFilterControl extends PureComponent<Props, State> {
  constructor(props) {
    super(props)

    const {tagKey, tagValue, filterType} = props.tagFilter

    this.state = {
      tagKey,
      tagValue,
      filterType,
      keySuggestions: [],
      valueSuggestions: [],
      draftState: 'DEFAULT',
    }
  }

  public render() {
    const {
      tagKey,
      tagValue,
      filterType,
      keySuggestions,
      valueSuggestions,
    } = this.state

    return (
      <div className="annotation-filter-control">
        <div className="annotation-filter-control--tag-key">
          <AnnotationFilterControlInput
            value={tagKey}
            inputClass="input-xs"
            onChange={this.handleTagKeyChange}
            onFocus={this.handleTagKeyFocus}
            onSelect={this.handleSelectTagKey}
            suggestions={keySuggestions}
          />
        </div>
        <Button
          text={filterType}
          color={ComponentColor.Default}
          status={ComponentStatus.Default}
          size={ComponentSize.ExtraSmall}
          onClick={this.toggleFilterType}
          tabIndex={-1}
        />
        <div className="annotation-filter-control--tag-value">
          <AnnotationFilterControlInput
            value={tagValue}
            inputClass="input-xs"
            onChange={this.handleTagValueChange}
            onFocus={this.handleTagValueFocus}
            onSelect={this.handleSelectTagValue}
            suggestions={valueSuggestions}
          />
        </div>
        {this.button}
      </div>
    )
  }

  public get button() {
    const {draftState} = this.state

    let status: ComponentStatus = ComponentStatus.Default
    let color: ComponentColor = ComponentColor.Default
    let icon: IconFont = IconFont.Trash
    let onClick = this.handleDelete

    if (draftState === 'SAVING') {
      status = ComponentStatus.Loading
      color = ComponentColor.Success
    } else if (draftState === 'EDITING') {
      icon = IconFont.Checkmark
      color = ComponentColor.Success
      onClick = this.save
    }

    if (!this.isValid && draftState !== 'DEFAULT') {
      status = ComponentStatus.Disabled
    }

    return (
      <Button
        text=""
        size={ComponentSize.ExtraSmall}
        shape={ButtonShape.Square}
        status={status}
        icon={icon}
        color={color}
        onClick={onClick}
      />
    )
  }

  private handleTagKeyFocus = async (): Promise<void> => {
    this.setState({draftState: 'EDITING'})

    const keySuggestions = await this.props.onGetKeySuggestions()

    this.setState({keySuggestions})
  }

  private handleTagValueFocus = async (): Promise<void> => {
    this.setState({draftState: 'EDITING'})

    const valueSuggestions = await this.props.onGetValueSuggestions(
      this.state.tagKey
    )

    this.setState({valueSuggestions})
  }

  private handleDelete = (): void => {
    const {onDelete, tagFilter} = this.props

    this.setState({draftState: 'SAVING'})

    onDelete(tagFilter)
  }

  private toggleFilterType = (): void => {
    const {filterType} = this.state

    this.setState({
      filterType: nextItem(FILTER_TYPES, filterType),
      draftState: 'EDITING',
    })
  }

  private save = async (): Promise<void> => {
    const {onUpdate, onDelete, tagFilter} = this.props
    const {tagKey, filterType, tagValue} = this.state

    if (!this.isValid) {
      return
    }

    this.setState({draftState: 'SAVING'})

    if (tagKey === '') {
      onDelete(tagFilter)
    } else {
      await onUpdate({id: tagFilter.id, tagKey, filterType, tagValue})
      this.setState({draftState: 'DEFAULT'})
    }
  }

  private handleSelectTagKey = (tagKey: string): void => {
    this.setState({tagKey}, this.save)
  }

  private handleSelectTagValue = (tagValue: string): void => {
    this.setState({tagValue}, this.save)
  }

  private handleTagKeyChange = (tagKey: string): void => {
    this.setState({tagKey})
  }

  private handleTagValueChange = (tagValue: string) => {
    this.setState({tagValue})
  }

  private get isValid() {
    const {tagKey, tagValue} = this.state

    return tagKey !== '' && tagValue !== ''
  }
}

export default AnnotationFilterControl
