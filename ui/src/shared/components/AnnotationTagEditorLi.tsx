import React, {PureComponent, ChangeEvent, KeyboardEvent} from 'react'

import {
  Button,
  ComponentColor,
  ComponentSize,
  ButtonShape,
  IconFont,
} from 'src/reusable_ui'

interface Props {
  tagKey: string
  tagValue: string
  shouldAutoFocus: boolean
  onUpdate: (tagKey: string, tagValue: string) => void
  onDelete: () => void
  onKeyDown: (e: string) => void
}

class AnnotationTagEditorLi extends PureComponent<Props> {
  public render() {
    const {tagKey, tagValue, onDelete, shouldAutoFocus} = this.props

    return (
      <div className="tag-control">
        <input
          className="form-control input-sm tag-control--key"
          value={tagKey}
          onChange={this.handleChangeTagKey}
          autoFocus={shouldAutoFocus}
        />
        <div className="tag-control--arrow">
          <span />
        </div>
        <input
          className="form-control input-sm tag-control--value"
          value={tagValue}
          onChange={this.handleChangeTagValue}
          onKeyDown={this.handleKeyDown}
        />
        <Button
          onClick={onDelete}
          icon={IconFont.Remove}
          shape={ButtonShape.Square}
          size={ComponentSize.Small}
          color={ComponentColor.Default}
        />
      </div>
    )
  }

  private handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    const {onKeyDown} = this.props

    onKeyDown(e.key)
  }

  private handleChangeTagKey = (e: ChangeEvent<HTMLInputElement>) => {
    const {onUpdate, tagValue} = this.props

    onUpdate(e.target.value, tagValue)
  }

  private handleChangeTagValue = (e: ChangeEvent<HTMLInputElement>) => {
    const {onUpdate, tagKey} = this.props

    onUpdate(tagKey, e.target.value)
  }
}

export default AnnotationTagEditorLi
