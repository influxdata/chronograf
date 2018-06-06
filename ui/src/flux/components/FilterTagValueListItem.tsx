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
}

interface State {
  isSelected: boolean
}

class FilterTagValueListItem extends PureComponent<Props, State> {
  constructor(props) {
    super(props)
    this.state = {
      isSelected: false,
    }
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
    const {tagKey, value} = this.props

    e.stopPropagation()
    this.props.changeValue(tagKey, value, !this.state.isSelected)
    this.setState({isSelected: !this.state.isSelected})
  }

  private get listItemClasses() {
    const {isSelected} = this.state
    const baseClasses = 'flux-schema-item query-builder--list-item'
    return isSelected ? baseClasses + ' active' : baseClasses
  }
}

export default FilterTagValueListItem
