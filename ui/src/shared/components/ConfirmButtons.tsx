import * as React from 'react'
import * as classnames from 'classnames'

export type Item = {} | string

export interface ConfirmButtonsProps {
  item?: Item
  onConfirm: (item?: Item) => void
  onCancel: (item?: Item) => void
  buttonSize?: string
  isDisabled?: boolean
}

class ConfirmButtons extends React.Component<ConfirmButtonsProps> {
  public static defaultProps = {
    buttonSize: 'btn-sm',
  }

  constructor(props: ConfirmButtonsProps) {
    super(props)
  }

  private handleConfirm = item => () => {
    this.props.onConfirm(item)
  }

  private handleCancel = item => () => {
    this.props.onCancel(item)
  }

  public render() {
    const {item, buttonSize, isDisabled} = this.props

    return (
      <div className="confirm-buttons">
        <button
          className={classnames('btn btn-info btn-square', {
            [buttonSize]: !!buttonSize,
          })}
          onClick={this.handleCancel(item)}
        >
          <span className="icon remove" />
        </button>
        <button
          className={classnames('btn btn-success btn-square', {
            [buttonSize]: !!buttonSize,
          })}
          disabled={isDisabled}
          title={isDisabled ? 'Cannot Save' : 'Save'}
          onClick={this.handleConfirm(item)}
        >
          <span className="icon checkmark" />
        </button>
      </div>
    )
  }
}

export default ConfirmButtons
