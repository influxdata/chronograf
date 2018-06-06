import React, {PureComponent, MouseEvent} from 'react'

export type SetFilterTagValue = (
  key: string,
  value: string,
  selected: boolean
) => void

interface Props {
  tagKey: string
  value: string
  changeValue: SetFilterTagValue
  selected: boolean
}

class FilterTagValueListItem extends PureComponent<Props> {
  constructor(props) {
    super(props)
  }

  public render() {
    const {value} = this.props

    return (
      <div
        className="flux-schema-tree flux-tree-node"
        onClick={this.handleClick}
      >
        <div className={this.listItemClasses}>
          <div className="query-builder--checkbox" />
          {value}
          <span className="flux-schema-type">Tag Value</span>
        </div>
      </div>
    )
  }

  private handleClick = (e: MouseEvent<HTMLDivElement>) => {
    const {tagKey, value, selected} = this.props

    e.stopPropagation()
    this.props.changeValue(tagKey, value, !selected)
  }

  private get listItemClasses() {
    const baseClasses = 'flux-schema-item query-builder--list-item'
    return this.props.selected ? baseClasses + ' active' : baseClasses
  }
}

export default FilterTagValueListItem
