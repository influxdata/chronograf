import React, {Component, MouseEvent, ChangeEvent, KeyboardEvent} from 'react'
import classnames from 'classnames'
import OnClickOutside from 'src/shared/components/OnClickOutside'
import DropdownMenu, {
  DropdownMenuEmpty,
} from 'src/shared/components/DropdownMenu'
import DropdownInput from 'src/shared/components/DropdownInput'
import DropdownHead from 'src/shared/components/DropdownHead'
import {ErrorHandling} from 'src/shared/decorators/errors'

import {DropdownItem, DropdownAction} from 'src/types'
import {CSSProperties} from 'react'
import {ComponentStatus} from 'src/reusable_ui'

interface AddNew {
  url?: string
  text: string
  handler?: () => void
}

interface Props {
  items: string[]
  onChoose: (item: string) => void
  searchTerm?: string
  onChangeSearchTerm: (value: string) => void
  status?: ComponentStatus
  selected: string
  addNew?: AddNew
  actions?: DropdownAction[]
  onClick?: (e: MouseEvent<HTMLDivElement>) => void
  iconName?: string
  className?: string
  buttonSize?: string
  buttonColor?: string
  menuWidth?: string
  menuLabel?: string
  menuClass?: string
  toggleStyle?: CSSProperties
  disabled?: boolean
  tabIndex?: number
}

interface State {
  isOpen: boolean
  highlightedItemIndex: number
}

class SearchableDropdown extends Component<Props, State> {
  public static defaultProps: Partial<Props> = {
    actions: [],
    searchTerm: '',
    buttonSize: 'btn-sm',
    buttonColor: 'btn-default',
    menuWidth: '100%',
    disabled: false,
    tabIndex: 0,
  }
  public dropdownRef: any

  constructor(props: Props) {
    super(props)
    this.state = {
      isOpen: false,
      highlightedItemIndex: null,
    }
  }

  public handleClickOutside = () => {
    this.setState({isOpen: false})
  }

  public handleSelection = (item: DropdownItem) => () => {
    this.toggleMenu()
    this.props.onChoose(item.text)
    this.dropdownRef.focus()
  }

  public handleHighlight = (itemIndex: number) => () => {
    this.setState({highlightedItemIndex: itemIndex})
  }

  public toggleMenu = (e?: MouseEvent<HTMLDivElement>) => {
    if (e) {
      e.stopPropagation()
    }

    if (!this.state.isOpen) {
      this.setState({
        highlightedItemIndex: null,
      })
    }

    this.setState({isOpen: !this.state.isOpen})
  }

  public handleAction = (action: DropdownAction, item: DropdownItem) => (
    e: MouseEvent<HTMLDivElement>
  ) => {
    e.stopPropagation()
    action.handler(item)
  }

  public handleFilterKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    const {items} = this.props
    const {highlightedItemIndex} = this.state

    if (e.key === 'Enter' && items.length) {
      this.setState({isOpen: false})
      this.props.onChoose(items[highlightedItemIndex])
    }
    if (e.key === 'Escape') {
      this.setState({isOpen: false})
    }
    if (e.key === 'ArrowUp' && highlightedItemIndex > 0) {
      this.setState({highlightedItemIndex: highlightedItemIndex - 1})
    }
    if (e.key === 'ArrowDown') {
      if (highlightedItemIndex < items.length - 1) {
        this.setState({highlightedItemIndex: highlightedItemIndex + 1})
      }
      if (highlightedItemIndex === null && items.length) {
        this.setState({highlightedItemIndex: 0})
      }
    }
  }

  public handleFilterChange = (e: ChangeEvent<HTMLInputElement>) => {
    this.props.onChangeSearchTerm(e.target.value)
    this.setState({
      highlightedItemIndex: null,
    })
  }

  public render() {
    const {
      items,
      addNew,
      actions,
      selected,
      disabled,
      iconName,
      tabIndex,
      className,
      menuClass,
      menuWidth,
      menuLabel,
      buttonSize,
      buttonColor,
      toggleStyle,
      searchTerm,
    } = this.props

    const {isOpen, highlightedItemIndex} = this.state
    const menuItems = items

    return (
      <div
        onClick={this.handleClick}
        className={classnames('dropdown', {
          open: isOpen,
          [className]: className,
        })}
        tabIndex={tabIndex}
        ref={r => (this.dropdownRef = r)}
        data-test="dropdown-toggle"
      >
        {isOpen ? (
          <DropdownInput
            searchTerm={searchTerm}
            buttonSize={buttonSize}
            buttonColor={buttonColor}
            toggleStyle={toggleStyle}
            disabled={disabled}
            placeholder="Search items..."
            onFilterChange={this.handleFilterChange}
            onFilterKeyPress={this.handleFilterKeyPress}
          />
        ) : (
          <DropdownHead
            iconName={iconName}
            selected={selected}
            buttonSize={buttonSize}
            buttonColor={buttonColor}
            toggleStyle={toggleStyle}
            disabled={disabled}
          />
        )}
        {isOpen && menuItems.length ? (
          <DropdownMenu
            addNew={addNew}
            actions={actions}
            items={menuItems.map(x => ({text: x}))}
            selected={selected}
            menuClass={menuClass}
            menuWidth={menuWidth}
            menuLabel={menuLabel}
            onAction={this.handleAction}
            useAutoComplete={true}
            onSelection={this.handleSelection}
            onHighlight={this.handleHighlight}
            highlightedItemIndex={highlightedItemIndex}
          />
        ) : (
          <DropdownMenuEmpty useAutoComplete={true} menuClass={menuClass} />
        )}
      </div>
    )
  }

  private handleClick = (e: MouseEvent<HTMLDivElement>) => {
    const {disabled, onClick} = this.props

    if (disabled) {
      return
    }

    this.toggleMenu(e)
    if (onClick) {
      onClick(e)
    }
  }
}

export default OnClickOutside(ErrorHandling(SearchableDropdown))
