import * as React from 'react'
import * as classnames from 'classnames'
import * as _ from 'lodash'

import onClickOutside from 'shared/components/onClickOutside'
import FancyScrollbar from 'shared/components/FancyScrollbar'
import {DROPDOWN_MENU_MAX_HEIGHT} from 'shared/constants/index'
import {eFunc} from 'src/types/funcs'

const labelText = ({localSelectedItems, isOpen, label}) => {
  if (localSelectedItems.length) {
    return localSelectedItems.map(s => s.name).join(', ')
  }

  if (label) {
    return label
  }

  // TODO: be smarter about the text displayed here
  if (isOpen) {
    return '0 Selected'
  }

  return 'None'
}

export interface Item {
  [key: string]: string
  name: string
}

export interface MultiSelectDropdownProps {
  onApply: eFunc
  items: Item[]
  selectedItems: Item[]
  label: string
  buttonSize: string
  buttonColor: string
  customClass: string
  iconName: string
  isApplyShown: boolean
}

export interface MultiSelectDropdownState {
  isOpen: boolean
  localSelectedItems: Item[]
}

class MultiSelectDropdown extends React.Component<
  MultiSelectDropdownProps,
  MultiSelectDropdownState
> {
  public static defaultProps = {
    buttonSize: 'btn-sm',
    buttonColor: 'btn-default',
    customClass: 'dropdown-160',
    selectedItems: [],
    isApplyShown: true,
  }

  constructor(props: MultiSelectDropdownProps) {
    super(props)
    this.state = {
      isOpen: false,
      localSelectedItems: props.selectedItems,
    }
  }

  private toggleMenu = e => {
    e.stopPropagation()
    this.setState({isOpen: !this.state.isOpen})
  }

  private onSelect = (item, e) => {
    e.stopPropagation()

    const {onApply, isApplyShown} = this.props
    const {localSelectedItems} = this.state

    let nextItems
    if (this.isSelected(item)) {
      nextItems = localSelectedItems.filter(i => i.name !== item.name)
    } else {
      nextItems = [...localSelectedItems, item]
    }

    if (!isApplyShown) {
      onApply(nextItems)
    }

    this.setState({localSelectedItems: nextItems})
  }

  private isSelected(item: Item) {
    return !!this.state.localSelectedItems.find(({name}) => name === item.name)
  }

  private handleApply = e => {
    e.stopPropagation()

    this.setState({isOpen: false})
    this.props.onApply(this.state.localSelectedItems)
  }

  public handleClickOutside() {
    this.setState({isOpen: false})
  }

  public componentWillReceiveProps(nextProps: MultiSelectDropdownProps) {
    if (!_.isEqual(this.props.selectedItems, nextProps.selectedItems)) {
      return
    }

    this.setState({localSelectedItems: nextProps.selectedItems})
  }

  public render() {
    const {localSelectedItems, isOpen} = this.state
    const {label, buttonSize, buttonColor, customClass, iconName} = this.props

    return (
      <div className={classnames(`dropdown ${customClass}`, {open: isOpen})}>
        <div
          onClick={this.toggleMenu}
          className={`dropdown-toggle btn ${buttonSize} ${buttonColor}`}
        >
          {iconName ? <span className={`icon ${iconName}`} /> : null}
          <span className="dropdown-selected">
            {labelText({localSelectedItems, isOpen, label})}
          </span>
          <span className="caret" />
        </div>
        {this.renderMenu()}
      </div>
    )
  }

  public renderMenu() {
    const {items, isApplyShown} = this.props
    const applyButton = isApplyShown ? (
      <li className="multi-select--apply">
        <button className="btn btn-xs btn-info" onClick={this.handleApply}>
          Apply
        </button>
      </li>
    ) : null

    return (
      <ul className="dropdown-menu">
        {applyButton}
        <FancyScrollbar
          autoHide={false}
          autoHeight={true}
          maxHeight={DROPDOWN_MENU_MAX_HEIGHT}
        >
          {items.map((listItem, i) => {
            return (
              <li
                key={i}
                className={classnames('multi-select--item', {
                  checked: this.isSelected(listItem),
                })}
                onClick={_.wrap(listItem, this.onSelect)}
              >
                <div className="multi-select--checkbox" />
                <span>{listItem.name}</span>
              </li>
            )
          })}
        </FancyScrollbar>
      </ul>
    )
  }
}

export default onClickOutside(MultiSelectDropdown)
