import React, {FunctionComponent, MouseEvent} from 'react'
import {Link} from 'react-router'

import classnames from 'classnames'
import {DROPDOWN_MENU_MAX_HEIGHT} from 'src/shared/constants/index'
import FancyScrollbar from 'src/shared/components/FancyScrollbar'
import DropdownMenuItem from 'src/shared/components/DropdownMenuItem'
import {
  OnActionHandler,
  OnSelectionHandler,
  OnHighlightHandler,
} from 'src/shared/components/DropdownMenuItem'
import Button from 'src/reusable_ui/components/Button'

import {
  ComponentColor,
  ComponentSize,
  ButtonShape,
  IconFont,
} from 'src/reusable_ui/types'
import {DropdownItem, DropdownAction} from 'src/types'

interface AddNew {
  url?: string
  text: string
  handler?: () => void
  stopPropagation?: boolean
}

const AddNewButton: FunctionComponent<AddNew> = ({
  url,
  text,
  handler,
  stopPropagation,
}) => {
  if (handler) {
    return (
      <li className="multi-select--apply">
        <Button
          text={text}
          onClick={(e: MouseEvent) => {
            if (stopPropagation) {
              e.stopPropagation()
            }
            handler()
          }}
          color={ComponentColor.Default}
          size={ComponentSize.ExtraSmall}
          shape={ButtonShape.StretchToFit}
          icon={IconFont.Plus}
        />
      </li>
    )
  }
  return (
    <li className="multi-select--apply">
      <Link className="btn btn-xs btn-default" to={url}>
        {text}
      </Link>
    </li>
  )
}

interface Props {
  onAction?: OnActionHandler
  actions: DropdownAction[]
  items: DropdownItem[]
  selected: string
  addNew?: AddNew
  iconName?: string
  buttonColor?: string
  menuWidth?: string
  menuLabel?: string
  menuClass?: string
  useAutoComplete?: boolean
  disabled?: boolean
  searchTerm?: string
  onSelection?: OnSelectionHandler
  onHighlight?: OnHighlightHandler
  highlightedItemIndex?: number
}

const DropdownMenu: FunctionComponent<Props> = ({
  items,
  addNew,
  actions,
  selected,
  onAction,
  menuClass,
  menuWidth,
  menuLabel,
  onSelection,
  onHighlight,
  useAutoComplete,
  highlightedItemIndex,
}) => {
  return (
    <ul
      className={classnames('dropdown-menu', {
        'dropdown-menu--no-highlight': useAutoComplete,
        [menuClass]: menuClass,
      })}
      style={{width: menuWidth}}
      data-test="dropdown-ul"
    >
      <FancyScrollbar
        autoHide={false}
        autoHeight={true}
        maxHeight={DROPDOWN_MENU_MAX_HEIGHT}
      >
        {menuLabel ? <li className="dropdown-header">{menuLabel}</li> : null}
        {items.map((item, i) => (
          <DropdownMenuItem
            item={item}
            actions={actions}
            onAction={onAction}
            highlightedItemIndex={highlightedItemIndex}
            onHighlight={onHighlight}
            selected={selected}
            onSelection={onSelection}
            index={i}
            key={i}
          />
        ))}
        {addNew && (
          <AddNewButton
            url={addNew.url}
            text={addNew.text}
            handler={addNew.handler}
            stopPropagation={addNew.stopPropagation}
          />
        )}
      </FancyScrollbar>
    </ul>
  )
}

interface DropdownMenuEmptyProps {
  useAutoComplete?: boolean
  menuClass: string
}

export const DropdownMenuEmpty: FunctionComponent<DropdownMenuEmptyProps> = ({
  useAutoComplete,
  menuClass,
}) => (
  <ul
    className={classnames('dropdown-menu', {
      'dropdown-menu--no-highlight': useAutoComplete,
      [menuClass]: menuClass,
    })}
  >
    <li className="dropdown-empty">No matching items</li>
  </ul>
)

export default DropdownMenu
