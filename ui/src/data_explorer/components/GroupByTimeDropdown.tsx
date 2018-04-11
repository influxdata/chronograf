import React, {PureComponent} from 'react'
import {withRouter, WithRouterProps} from 'react-router'

import groupByTimeOptions from 'src/data_explorer/data/groupByTimes'

import Dropdown from 'src/shared/components/Dropdown'

import {AUTO_GROUP_BY} from 'src/shared/constants'

interface Props {
  selected: string
  onChooseGroupByTime: () => void
}

class GroupByTimeDropdown extends PureComponent<Props & WithRouterProps> {
  public render() {
    return (
      <div className="group-by-time">
        <label className="group-by-time--label">Group by:</label>
        <Dropdown
          className="group-by-time--dropdown"
          items={this.dropdownItems}
          menuClass={this.menuClass}
          selected={this.selectedText}
          buttonColor={this.buttonColors}
          onChoose={this.props.onChooseGroupByTime}
        />
      </div>
    )
  }

  private get options() {
    if (this.isInRuleBuilder) {
      return groupByTimeOptions.filter(
        ({menuOption}) => menuOption !== AUTO_GROUP_BY
      )
    }

    return groupByTimeOptions
  }

  private get selectedText() {
    return this.props.selected || 'Time'
  }

  private get dropdownItems() {
    return this.options.map(groupBy => ({
      ...groupBy,
      text: groupBy.menuOption,
    }))
  }

  private get menuClass() {
    if (this.isInRuleBuilder) {
      return 'dropdown-malachite'
    }

    return ''
  }

  private get buttonColors() {
    if (this.isInRuleBuilder) {
      return 'btn-default'
    }

    return 'btn-info'
  }

  private get isInRuleBuilder() {
    return this.props.location.pathname.includes('alert-rules')
  }
}

export default withRouter(GroupByTimeDropdown)
