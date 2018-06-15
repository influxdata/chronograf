import React, {PureComponent} from 'react'
import {ErrorHandling} from 'src/shared/decorators/errors'
import OptIn from 'src/shared/components/OptIn'

interface Props {
  digits: string
  onDecimalPlacesChange: (digits: string) => void
}

const fixedValueString = 'fixed'

@ErrorHandling
class GraphOptionsDecimalPlaces extends PureComponent<Props> {
  constructor(props: Props) {
    super(props)
  }

  public render() {
    const {digits} = this.props
    return (
      <div className="form-group col-xs-6">
        <label>Decimal Places </label>
        <OptIn
          customPlaceholder={this.isEnforced ? digits : 'unlimited'}
          customValue={this.isEnforced ? digits : ''}
          onSetValue={this.onSetValue}
          fixedPlaceholder={''}
          fixedValue={fixedValueString}
          type="number"
          min={'0'}
        />
      </div>
    )
  }

  private get isEnforced(): boolean {
    const {digits} = this.props

    return digits !== ''
  }

  private get digits(): string {
    if (!this.isEnforced) {
      return '0'
    }

    return this.props.digits
  }

  private onSetValue = (valueFromSelector: string): void => {
    let digits: string
    if (valueFromSelector === 'fixed') {
      digits = ''
    } else if (valueFromSelector === '') {
      digits = this.digits
    } else {
      const num = Number(valueFromSelector)
      if (num < 0) {
        digits = '0'
      } else {
        digits = valueFromSelector
      }
    }

    this.props.onDecimalPlacesChange(digits)
  }
}

export default GraphOptionsDecimalPlaces
