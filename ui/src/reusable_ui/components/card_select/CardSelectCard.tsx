import React, {PureComponent} from 'react'
import {ErrorHandling} from 'src/shared/decorators/errors'

import classnames from 'classnames'

interface Props {
  id: string
  label: string
  image?: string
  checked?: boolean
  disabled?: boolean
}

interface State {
  checked?: boolean
}

@ErrorHandling
class CardSelectCard extends PureComponent<Props, State> {
  public static defaultProps: Partial<Props> = {
    checked: false,
    disabled: false,
  }

  constructor(props) {
    super(props)
    this.state = {
      checked: this.props.checked,
    }
  }

  public render() {
    const {id, label, disabled} = this.props
    const {checked} = this.state

    return (
      <div
        data-toggle="card_toggle"
        onClick={this.toggleChecked}
        className={classnames('card-select--card', {
          'card-select--checked': checked,
          'card-select--disabled': disabled,
          'card-select--active': !disabled,
        })}
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
            className={classnames(
              'card-select--checkmark',
              'icon',
              'checkmark',
              {
                'card-select--checked': checked,
              }
            )}
          />
          <div className="card-select--image">{this.cardImage}</div>
        </label>
      </div>
    )
  }

  private toggleChecked = e => {
    const {disabled} = this.props

    if (!disabled) {
      const {checked} = this.state
      e.preventDefault()
      this.setState({
        checked: !checked,
      })
    }
  }

  private get cardImage() {
    const {image, label} = this.props

    if (image) {
      return <img src={image} alt={`${label} icon`} />
    }

    return <span className="card-select--placeholder icon dash-j" />
  }
}

export default CardSelectCard
