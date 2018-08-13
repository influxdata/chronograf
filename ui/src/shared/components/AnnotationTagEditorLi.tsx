import React, {PureComponent, ChangeEvent} from 'react'

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
  onUpdate: (tagKey: string, tagValue: string) => void
  onDelete: () => void
}

class AnnotationTagEditorLi extends PureComponent<Props> {
  public render() {
    const {tagKey, tagValue, onDelete} = this.props

    return (
      <div className="tag-control">
        <input
          className="form-control input-sm tag-control--key"
          value={tagKey}
          onChange={this.handleChangeTagKey}
        />
        <div className="tag-control--arrow">
          <span />
        </div>
        <input
          className="form-control input-sm tag-control--value"
          value={tagValue}
          onChange={this.handleChangeTagValue}
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
