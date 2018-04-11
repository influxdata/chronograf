import React, {PureComponent} from 'react'
import {withRouter, WithRouterProps} from 'react-router'
import {Location} from 'history'

import groupByTimeOptions from 'src/data_explorer/data/groupByTimes'

import Dropdown from 'src/shared/components/Dropdown'

import {AUTO_GROUP_BY} from 'src/shared/constants'

interface Props {
  location: Location
  selected: string
  onChooseGroupByTime: () => void
}

class GroupByTimeDropdown extends PureComponent<Props> {
  public render() {
    return (
      <div className="group-by-time">
        <label className="group-by-time--label">Group by:</label>
        <Dropdown
          className="group-by-time--dropdown"
          menuClass={this.menuClass}
          buttonColor={this.buttonColors}
          items={this.items}
          onChoose={this.props.onChooseGroupByTime}
          selected={this.selectedText}
        />
      </div>
    )
  }

  private get selectedText() {
    return this.props.selected || 'Time'
  }

  private get items() {
    if (this.isInRuleBuilder) {
      return groupByTimeOptions.filter(
        ({menuOption}) => menuOption !== AUTO_GROUP_BY
      )
    }

    return groupByTimeOptions
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
