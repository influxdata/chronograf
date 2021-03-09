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

interface AddNew {
  url?: string
  text: string
  handler?: () => void
}

interface Props {
  items: DropdownItem[]
  onChoose: (item: DropdownItem) => void
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
  useAutoComplete?: boolean
  toggleStyle?: CSSProperties
  disabled?: boolean
  tabIndex?: number
}

interface State {
  isOpen: boolean
  searchTerm: string
  filteredItems: DropdownItem[]
  highlightedItemIndex: number
}

@ErrorHandling
export class Dropdown extends Component<Props, State> {
  public static defaultProps: Partial<Props> = {
    actions: [],
    buttonSize: 'btn-sm',
    buttonColor: 'btn-default',
    menuWidth: '100%',
    useAutoComplete: false,
    disabled: false,
    tabIndex: 0,
  }
  public dropdownRef: any

  constructor(props: Props) {
    super(props)
    this.state = {
      isOpen: false,
      searchTerm: '',
      filteredItems: this.props.items,
      highlightedItemIndex: null,
    }
  }

  public handleClickOutside = () => {
    this.setState({isOpen: false})
  }

  public handleSelection = (item: DropdownItem) => () => {
    this.toggleMenu()
    this.props.onChoose(item)
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
        searchTerm: '',
        filteredItems: this.props.items,
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
    const {filteredItems, highlightedItemIndex} = this.state

    if (e.key === 'Enter' && filteredItems.length) {
      this.setState({isOpen: false})
      this.props.onChoose(filteredItems[highlightedItemIndex])
    }
    if (e.key === 'Escape') {
      this.setState({isOpen: false})
    }
    if (e.key === 'ArrowUp' && highlightedItemIndex > 0) {
      this.setState({highlightedItemIndex: highlightedItemIndex - 1})
    }
    if (e.key === 'ArrowDown') {
      if (highlightedItemIndex < filteredItems.length - 1) {
        this.setState({highlightedItemIndex: highlightedItemIndex + 1})
      }
      if (highlightedItemIndex === null && filteredItems.length) {
        this.setState({highlightedItemIndex: 0})
      }
    }
  }

  public handleFilterChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
      return this.setState({searchTerm: e.target.value}, () =>
        this.applyFilter(this.state.searchTerm)
      )
    }

    this.setState({
      searchTerm: '',
      filteredItems: this.props.items,
      highlightedItemIndex: null,
    })
  }

  public applyFilter = (searchTerm: string) => {
    const {items} = this.props
    const filterText = searchTerm.toLowerCase()
    const matchingItems = items.filter(item => {
      if (!item) {
        return false
      }

      return item.text.toLowerCase().includes(filterText)
    })

    this.setState({
      filteredItems: matchingItems,
      highlightedItemIndex: 0,
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
      useAutoComplete,
    } = this.props

    const {isOpen, searchTerm, filteredItems, highlightedItemIndex} = this.state
    const menuItems = useAutoComplete ? filteredItems : items

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
        {useAutoComplete && isOpen ? (
          <DropdownInput
            searchTerm={searchTerm}
            buttonSize={buttonSize}
            buttonColor={buttonColor}
            toggleStyle={toggleStyle}
            disabled={disabled}
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
            items={menuItems}
            selected={selected}
            menuClass={menuClass}
            menuWidth={menuWidth}
            menuLabel={menuLabel}
            onAction={this.handleAction}
            useAutoComplete={useAutoComplete}
            onSelection={this.handleSelection}
            onHighlight={this.handleHighlight}
            highlightedItemIndex={highlightedItemIndex}
          />
        ) : (
          <DropdownMenuEmpty
            useAutoComplete={useAutoComplete}
            menuClass={menuClass}
          />
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

export default OnClickOutside(Dropdown)
