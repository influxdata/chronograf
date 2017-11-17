import * as React from 'react'
import {Link} from 'react-router-dom'
import * as classnames from 'classnames'
import onClickOutside from 'shared/components/onClickOutside'
import FancyScrollbar from 'shared/components/FancyScrollbar'
import {DROPDOWN_MENU_MAX_HEIGHT} from 'shared/constants/index'

import {DropdownItem, DropdownActions} from 'src/types'

export interface DropdownProps {
  actions?: DropdownActions[]
  items: DropdownItem[]
  onChoose: (item: {}) => void
  onClick?: (e: Event) => void
  addNew?: {
    url: string
    text: string
  }
  selected: string
  iconName?: string
  className?: string
  buttonSize?: string
  buttonColor?: string
  menuWidth?: string
  menuLabel?: string
  menuClass?: string
  useAutoComplete?: boolean
  toggleStyle?: {}
}

export interface DropdownState {
  isOpen: boolean
  searchTerm: string
  filteredItems: DropdownItem[]
  highlightedItemIndex?: number
}

class Dropdown extends React.Component<DropdownProps, DropdownState> {
  public static defaultProps = {
    actions: [],
    buttonSize: 'btn-sm',
    buttonColor: 'btn-default',
    menuWidth: '100%',
    useAutoComplete: false,
  }

  private dropdownAutoComplete

  constructor(props: DropdownProps) {
    super(props)
    this.state = {
      isOpen: false,
      searchTerm: '',
      filteredItems: this.props.items,
      highlightedItemIndex: null,
    }
  }

  private handleClick = e => {
    this.toggleMenu(e)
    if (this.props.onClick) {
      this.props.onClick(e)
    }
  }

  private handleSelection = item => () => {
    this.toggleMenu()
    this.props.onChoose(item)
  }

  private handleHighlight = itemIndex => () => {
    this.setState({highlightedItemIndex: itemIndex})
  }

  private toggleMenu = (e?) => {
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

  private handleAction = (action, item) => e => {
    e.stopPropagation()
    action.handler(item)
  }

  private handleFilterKeyPress = e => {
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

  private handleFilterChange = e => {
    if (e.target.value === null || e.target.value === '') {
      this.setState({
        searchTerm: '',
        filteredItems: this.props.items,
        highlightedItemIndex: null,
      })
    } else {
      this.setState({searchTerm: e.target.value}, () =>
        this.applyFilter(this.state.searchTerm)
      )
    }
  }

  private applyFilter = searchTerm => {
    const {items} = this.props
    const filterText = searchTerm.toLowerCase()
    const matchingItems = items.filter(item =>
      item.text.toLowerCase().includes(filterText)
    )

    this.setState({
      filteredItems: matchingItems,
      highlightedItemIndex: 0,
    })
  }

  private renderMenu() {
    const {
      actions,
      addNew,
      items,
      menuWidth,
      menuLabel,
      menuClass,
      useAutoComplete,
      selected,
    } = this.props
    const {filteredItems, highlightedItemIndex} = this.state
    const menuItems = useAutoComplete ? filteredItems : items

    return (
      <ul
        className={classnames('dropdown-menu', {
          'dropdown-menu--no-highlight': useAutoComplete,
          [menuClass]: menuClass,
        })}
        style={{width: menuWidth}}
      >
        <FancyScrollbar
          autoHide={false}
          autoHeight={true}
          maxHeight={DROPDOWN_MENU_MAX_HEIGHT}
        >
          {menuLabel ? <li className="dropdown-header">{menuLabel}</li> : null}
          {menuItems.map((item, i) => {
            if (item.text === 'SEPARATOR') {
              return <li key={i} className="dropdown-divider" />
            }
            return (
              <li
                className={classnames('dropdown-item', {
                  highlight: i === highlightedItemIndex,
                  active: item.text === selected,
                })}
                key={i}
              >
                <a
                  href="#"
                  onClick={this.handleSelection(item)}
                  onMouseOver={this.handleHighlight(i)}
                >
                  {item.text}
                </a>
                {actions.length > 0 && (
                  <div className="dropdown-actions">
                    {actions.map(action => {
                      return (
                        <button
                          key={action.text}
                          className="dropdown-action"
                          onClick={this.handleAction(action, item)}
                        >
                          <span
                            title={action.text}
                            className={`icon ${action.icon}`}
                          />
                        </button>
                      )
                    })}
                  </div>
                )}
              </li>
            )
          })}
          {addNew && (
            <li className="multi-select--apply">
              <Link className="btn btn-xs btn-default" to={addNew.url}>
                {addNew.text}
              </Link>
            </li>
          )}
        </FancyScrollbar>
      </ul>
    )
  }

  public handleClickOutside = () => {
    this.setState({isOpen: false})
  }

  public render() {
    const {
      items,
      selected,
      className,
      menuClass,
      iconName,
      buttonSize,
      buttonColor,
      toggleStyle,
      useAutoComplete,
    } = this.props
    const {isOpen, searchTerm, filteredItems} = this.state
    const menuItems = useAutoComplete ? filteredItems : items

    return (
      <div
        onClick={this.handleClick}
        className={classnames('dropdown', {
          open: isOpen,
          [className]: className,
        })}
      >
        {useAutoComplete && isOpen ? (
          <div
            className={`dropdown-autocomplete dropdown-toggle ${buttonSize} ${
              buttonColor
            }`}
            style={toggleStyle}
          >
            <input
              ref={r => (this.dropdownAutoComplete = r)}
              className="dropdown-autocomplete--input"
              type="text"
              autoFocus={true}
              placeholder="Filter items..."
              spellCheck={false}
              onChange={this.handleFilterChange}
              onKeyDown={this.handleFilterKeyPress}
              value={searchTerm}
            />
            <span className="caret" />
          </div>
        ) : (
          <div
            className={`btn dropdown-toggle ${buttonSize} ${buttonColor}`}
            style={toggleStyle}
          >
            {iconName ? (
              <span className={classnames('icon', {[iconName]: true})} />
            ) : null}
            <span className="dropdown-selected">{selected}</span>
            <span className="caret" />
          </div>
        )}
        {isOpen && menuItems.length && this.renderMenu()}
        {isOpen &&
          !menuItems.length && (
            <ul
              className={classnames('dropdown-menu', {
                'dropdown-menu--no-highlight': useAutoComplete,
                [menuClass]: menuClass,
              })}
            >
              <li className="dropdown-empty">No matching items</li>
            </ul>
          )}
      </div>
    )
  }
}

export default onClickOutside<DropdownProps>(Dropdown)
