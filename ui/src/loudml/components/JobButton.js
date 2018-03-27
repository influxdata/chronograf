import React, {Component} from 'react'
import {PropTypes} from 'prop-types'
import ConfirmButton from 'src/shared/components/ConfirmButton'

class JobButton extends Component {
    constructor(props) {
        super(props)
    
    }

    handleConfirm = () => {
        this.props.onStop()
    }

    render() {
        const {
            stopLabel,
            startLabel,
            disabled,
            running,
            onStart,
            customClass,
            confirmText,
        } = this.props

        if (running) {
            return (
                <ConfirmButton
                    text={stopLabel}
                    confirmText={confirmText}
                    confirmAction={this.handleConfirm}
                    size="btn-xs"
                    customClass={customClass}
                />)
        }

        return (
            <button
                className={`btn btn-xs btn-default ${customClass}`}
                onClick={onStart}
                disabled={disabled}
            >
                {startLabel}
            </button>)
    }
}

JobButton.defaultProps = {
    onStart: () => {},
    startLabel: '',
    customClass: '',
}

const {string, func, bool} = PropTypes

JobButton.propTypes = {
    startLabel: string,
    stopLabel: string.isRequired,
    onStart: func,
    onStop: func.isRequired,
    running: bool.isRequired,
    disabled: bool.isRequired,
    customClass: string,
    confirmText: string,
}

export default JobButton
