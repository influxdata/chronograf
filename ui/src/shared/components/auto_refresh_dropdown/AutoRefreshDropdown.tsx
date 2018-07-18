import React, {Component} from 'react'
import classnames from 'classnames'

import Dropdown from 'src/reusable_ui/components/dropdowns/Dropdown'
import DropdownItem from 'src/reusable_ui/components/dropdowns/DropdownItem'
import DropdownDivider from 'src/reusable_ui/components/dropdowns/DropdownDivider'
import {IconFont} from 'src/reusable_ui/types'

import {
  autoRefreshOptions,
  AutoRefreshOption,
} from 'src/shared/components/auto_refresh_dropdown/autoRefreshOptions'
import {ErrorHandling} from 'src/shared/decorators/errors'

interface Props {
  selected: number
  onChoose: (milliseconds: number) => void
  onManualRefresh: () => void
}

@ErrorHandling
class AutoRefreshDropdown extends Component<Props> {
  public render() {
    return (
      <div className={this.className}>
        <Dropdown
          icon={this.dropdownIcon}
          selectedItem={this.optionText}
          onChange={this.handleDropdownChange}
        >
          <DropdownDivider text="AutoRefresh" />
          {autoRefreshOptions.map(option => (
            <DropdownItem key={option.text} text={option.text} value={option} />
          ))}
        </Dropdown>
        {this.manualRefreshButton}
      </div>
    )
  }

  private handleDropdownChange = (option: AutoRefreshOption): void => {
    const {onChoose} = this.props
    const {milliseconds} = option

    onChoose(milliseconds)
  }

  private get optionText(): string {
    const {selected} = this.props
    const {text} = autoRefreshOptions.find(
      option => option.milliseconds === selected
    )

    return text
  }

  private get className(): string {
    const {selected} = this.props

    return classnames('autorefresh-dropdown', {
      paused: selected === 0,
    })
  }

  private get dropdownIcon(): IconFont {
    const {selected} = this.props

    if (selected === 0) {
      return IconFont.Pause
    }

    return IconFont.Refresh
  }

  private get manualRefreshButton(): JSX.Element {
    const {selected, onManualRefresh} = this.props

    if (selected === 0) {
      return (
        <div
          className="btn btn-sm btn-default btn-square"
          onClick={onManualRefresh}
        >
          <span className={`icon ${IconFont.Refresh}`} />
        </div>
      )
    }

    return null
  }
}

export default AutoRefreshDropdown
