import React, {PureComponent} from 'react'
import {PRECISION_DEFAULT} from 'src/shared/constants/tableGraph'

interface Props {
  precision: number
  onPrecisionChange: (format: string) => void
}

interface State {
  precision: number
}

class GraphOptionsPrecision extends PureComponent<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      precision: this.props.precision || PRECISION_DEFAULT,
    }
  }

  get onPrecisionChange() {
    return this.props.onPrecisionChange
  }

  public handlePrecisionChange = e => {
    const precision = e.target.value
    this.setState({precision})
    this.onPrecisionChange(precision)
  }

  public render() {
    const inputClass = 'form-control input-sm'
    const {precision} = this.state
    return (
      <div className="form-group col-xs-12 col-md-4">
        <label>Data Precision</label>
        <input
          value={precision}
          className={inputClass}
          type="number"
          onChange={this.handlePrecisionChange}
          onBlur={this.handlePrecisionChange}
        />
      </div>
    )
  }
}

export default GraphOptionsPrecision
