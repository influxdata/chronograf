import React, {Component} from 'react'
import classnames from 'classnames'

import {DropdownChild} from 'src/reusable_ui/types'

interface Props {
  children: DropdownChild
  itemKey: string
  text?: string
}

class DropdownDivider extends Component<Props> {
  public static defaultProps: Partial<Props> = {
    text: '',
  }

  public render() {
    const {text} = this.props

    return (
      <div className={classnames('dropdown--divider', {line: !text})}>
        {text}
      </div>
    )
  }
}

export default DropdownDivider
