import * as React from 'react'
import * as PropTypes from 'prop-types'
import classnames from 'classnames'

import onClickOutside from 'shared/components/onClickOutside'
import ConfirmButtons from 'shared/components/ConfirmButtons'

const DeleteButton = ({onClickDelete, buttonSize}) =>
  <button
    className={classnames('btn btn-danger table--show-on-row-hover', {
      [buttonSize]: buttonSize,
    })}
    onClick={onClickDelete}
  >
    Delete
  </button>

class DeleteConfirmButtons extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      isConfirming: false,
    }
  }

  handleClickDelete = () => {
    this.setState({isConfirming: true})
  }

  handleCancel = () => {
    this.setState({isConfirming: false})
  }

  handleClickOutside = () => {
    this.setState({isConfirming: false})
  }

  render() {
    const {onDelete, item, buttonSize} = this.props
    const {isConfirming} = this.state

    return isConfirming
      ? <ConfirmButtons
          onConfirm={onDelete}
          item={item}
          onCancel={this.handleCancel}
          buttonSize={buttonSize}
        />
      : <DeleteButton
          onClickDelete={this.handleClickDelete}
          buttonSize={buttonSize}
        />
  }
}

const {func, oneOfType, shape, string} = PropTypes

DeleteButton.propTypes = {
  onClickDelete: func.isRequired,
  buttonSize: string,
}

DeleteConfirmButtons.propTypes = {
  item: oneOfType([(string, shape())]),
  onDelete: func.isRequired,
  buttonSize: string,
}

DeleteConfirmButtons.defaultProps = {
  buttonSize: 'btn-sm',
}

export default onClickOutside(DeleteConfirmButtons)
