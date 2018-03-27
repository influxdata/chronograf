import React, { Component } from 'react'
import PropTypes from 'prop-types'

import ConfirmOrCancel from 'shared/components/ConfirmOrCancel'

const FeatureHeader = ({
    feature,
    onEdit,
    onKeyDown,
    onConfirm,
    onDelete,
    disabled,
}) => {
    if (feature.isEditing) {
        return (
            <EditHeader
                feature={feature}
                onEdit={onEdit}
                onKeyDown={onKeyDown}
                onConfirm={onConfirm}
                onCancel={onDelete}
            />
        )
    }

    return (
      <Header
          feature={feature}
          onDelete={onDelete}
          disabled={disabled}
      />
    )
}

class Header extends Component {
    constructor(props) {
        super(props)

        this.state = {
            isDeleting: false,
        }
    }

    onStartDelete = () => {
        this.setState({isDeleting: true})
    }

    onCancelDelete = () => {
      this.setState({isDeleting: false})
    }

    render() {
        const {
            feature,
            onDelete,
            disabled,
        } = this.props
        const {isDeleting} = this.state

        const buttons = (
          disabled
              ?null
              :(<button
                className="btn btn-xs btn-danger"
                onClick={this.onStartDelete}
                >
                Delete
                </button>)
        )
          
        const deleteConfirmation = (
            <ConfirmOrCancel
                square={true}
                item={feature}
                onConfirm={onDelete}
                onCancel={this.onCancelDelete}
                buttonSize="btn-xs"
            />)
            
        return (
            <div className="db-manager-header">
                <h4>{feature.name}</h4>
                <div className="db-manager-header--actions text-right">
                    {isDeleting?deleteConfirmation:buttons}
                </div>
            </div>)
    }
}

const EditHeader = ({
    feature,
    onEdit,
    onKeyDown,
    onConfirm,
    onCancel
}) => (
    <div className="db-manager-header db-manager-header--edit">
        <input
            className="form-control input-sm"
            name="name"
            type="text"
            value={feature.name}
            placeholder="Name this Feature"
            onChange={onEdit(feature)}
            onKeyDown={onKeyDown(feature)}
            autoFocus={true}
            spellCheck={false}
            autoComplete="false"
        />
        <ConfirmOrCancel
            item={feature}
            onConfirm={onConfirm}
            onCancel={onCancel} />
    </div>
)

const {func, shape, bool} = PropTypes

FeatureHeader.propTypes = {
    onEdit: func,
    feature: shape(),
    onKeyDown: func,
    // onCancel: func,
    onDelete: func,
    onConfirm: func,
    disabled: bool.isRequired,
}

Header.propTypes = {
  // onConfirm: func,
  onCancel: func,
  onDelete: func,
  feature: shape(),
  disabled: bool.isRequired,
}

EditHeader.propTypes = {
  feature: shape(),
  onEdit: func,
  onKeyDown: func,
  onCancel: func,
  onConfirm: func,
}

export default FeatureHeader
