import React, {Component} from 'react'
import classnames from 'classnames'

interface Props {
  text: string
  selected?: boolean
  checkbox?: boolean
  onClick?: () => void
}

class DropdownItem extends Component<Props> {
  public static defaultProps = {
    checkbox: true,
    selected: false,
  }

  public render() {
    const {text, selected, onClick, checkbox} = this.props

    return (
      <div
        className={classnames('dropdown--item', {
          active: selected,
          'multi-select--item': checkbox,
        })}
        onClick={onClick}
      >
        {this.checkBox}
        {this.dot}
        {text}
      </div>
    )
  }

  private get checkBox(): JSX.Element {
    const {checkbox} = this.props

    if (checkbox) {
      return <div className="dropdown-item--checkbox" />
    }

    return null
  }

  private get dot(): JSX.Element {
    const {checkbox, selected} = this.props

    if (selected && !checkbox) {
      return <div className="dropdown-item--dot" />
    }
  }
}

export default DropdownItem
