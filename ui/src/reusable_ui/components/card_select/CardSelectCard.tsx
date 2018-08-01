import React, {PureComponent} from 'react'
import {ErrorHandling} from 'src/shared/decorators/errors'

import 'src/reusable_ui/components/card_select/CardSelectCard.scss'

interface Props {
  id: string
  label: string
  image?: string
  checked?: boolean
  disabled?: boolean
  // validState: ...
}

interface State {
  checked?: boolean
}

@ErrorHandling
class CardSelectCard extends PureComponent<Props, State> {
  constructor(props) {
    super(props)
    this.state = {
      checked: false,
    }
  }

  public render() {
    const {id, label, disabled} = this.props
    const {checked} = this.state

    return (
      <div
        onClick={this.handleClick}
        className={`card-select--card${this.checkedClass}`}
      >
        <label className="card-select--container">
          <span className="card-select--label">{label}</span>
          <input
            id={`card_select_${id}`}
            name={`card_select_${id}`}
            type="checkbox"
            value={id}
            checked={checked}
            disabled={disabled}
          />
          <span
            className={`card-select--checkmark icon checkmark${
              this.checkedClass
            }`}
          />
          {this.cardImage}
        </label>
      </div>
    )
  }

  private handleClick = e => {
    const {checked} = this.state
    e.preventDefault()
    this.setState({
      checked: !checked,
    })
  }

  private get checkedClass() {
    const {checked} = this.state
    if (checked) {
      return ' checked'
    }
    return ''
  }

  private get cardImage() {
    const {image, label} = this.props

    if (image) {
      return (
        <div className="card-select--image">
          <img src={image} alt={`${label} icon`} />
        </div>
      )
    }

    return null
  }
}

export default CardSelectCard
