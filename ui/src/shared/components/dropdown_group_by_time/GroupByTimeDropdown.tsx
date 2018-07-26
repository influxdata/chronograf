import React, {Component} from 'react'

import groupByTimeOptions from 'src/shared/components/dropdown_group_by_time/groupByTimes'

import Dropdown from 'src/reusable_ui/components/dropdowns/Dropdown'
import {ComponentColor} from 'src/reusable_ui/types'

import {AUTO_GROUP_BY} from 'src/shared/constants'
import {GroupBy} from 'src/types'
import {DropdownMenuColors} from 'src/reusable_ui/types'

import './GroupByTimeDropdown.scss'

interface Props {
  selected: string
  onChooseGroupByTime: (groupBy: GroupBy) => void
  isDisabled: boolean
  excludeAutoOption?: boolean
  menuColor?: DropdownMenuColors
}

class GroupByTimeDropdown extends Component<Props> {
  public static defaultProps = {
    excludeAutoOption: false,
    menuColor: DropdownMenuColors.Sapphire,
  }

  public render() {
    const {selected, onChooseGroupByTime, isDisabled, menuColor} = this.props

    return (
      <div className="group-by-time">
        <label className="group-by-time--label">Group by:</label>
        <Dropdown
          color={this.dropdownColor}
          onChange={onChooseGroupByTime}
          selectedItem={selected || 'Time'}
          disabled={isDisabled}
          width={76}
          menuColor={menuColor}
        >
          {this.menuItems}
        </Dropdown>
      </div>
    )
  }

  private get dropdownColor(): ComponentColor {
    const {excludeAutoOption} = this.props

    if (excludeAutoOption) {
      return ComponentColor.Default
    }

    return ComponentColor.Primary
  }

  private get menuItems(): JSX.Element[] {
    const {excludeAutoOption} = this.props

    let items = groupByTimeOptions

    if (excludeAutoOption) {
      items = groupByTimeOptions.filter(
        ({menuOption}) => menuOption !== AUTO_GROUP_BY
      )
    }

    return items.map(item => (
      <Dropdown.Item
        key={item.defaultTimeBound}
        text={item.menuOption}
        value={item}
      />
    ))
  }
}

export default GroupByTimeDropdown
