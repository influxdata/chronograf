import * as React from 'react'
import * as _ from 'lodash'

export interface TagInputProps {
  onAddTag: (tag: string) => void
  onDeleteTag: (tag: string) => () => void
  tags: string[]
  title: string
}

export class TagInput extends React.Component<TagInputProps> {
  private input

  private handleAddTag = e => {
    if (e.key === 'Enter') {
      e.preventDefault()
      const newItem = e.target.value.trim()
      const {tags, onAddTag} = this.props
      if (!this.shouldAddToList(newItem, tags)) {
        return
      }

      this.input.value = ''
      onAddTag(newItem)
    }
  }

  private shouldAddToList(item: string, tags: string[]) {
    return !_.isEmpty(item) && !tags.find(l => l === item)
  }

  public render() {
    const {title, tags, onDeleteTag} = this.props

    return (
      <div className="form-group col-xs-12">
        <label htmlFor={title}>{title}</label>
        <input
          placeholder={`Type and hit 'Enter' to add to list of ${title}`}
          autoComplete="off"
          className="form-control"
          id={title}
          type="text"
          ref={r => (this.input = r)}
          onKeyDown={this.handleAddTag}
        />
        <Tags tags={tags} onDeleteTag={onDeleteTag} />
      </div>
    )
  }
}

export interface TagsProps {
  tags: string[]
  onDeleteTag: (tag: string) => () => void
}

const Tags: React.SFC<TagsProps> = ({tags, onDeleteTag}) => (
  <div className="input-tag-list">
    {tags.map(item => {
      return <Tag key={item} item={item} onDelete={onDeleteTag} />
    })}
  </div>
)

export interface TagProps {
  item: string
  onDelete: (item: string) => () => void
}

const Tag: React.SFC<TagProps> = ({item, onDelete}) => (
  <span key={item} className="input-tag-item">
    <span>{item}</span>
    <span className="icon remove" onClick={onDelete(item)} />
  </span>
)
