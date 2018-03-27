import React, { Component } from 'react'
import {PropTypes} from 'prop-types'
import classnames from 'classnames'
import moment from 'moment'

import ConfirmButton from 'src/shared/components/ConfirmButton'
import OnClickOutside from 'shared/components/OnClickOutside'

import CustomTimeRange from 'src/loudml/components/CustomTimeRange'

const emptyTime = {lower: '', upper: ''}

class CustomTimeJobButton extends Component {
    constructor(props) {
        super(props)
        const {lower, upper} = props.selected

        const isTimeValid = moment(upper).isValid() && moment(lower).isValid()
        const customTimeRange = isTimeValid ? {lower, upper} : emptyTime
    
        this.state = {
            isCustomTimeRangeOpen: false,
            customTimeRange,
        }
    }

    handleClickOutside = () => {
        this.setState({isCustomTimeRangeOpen: false})
    }

    toggleMenu = () => {
        const {disabled} = this.props

        if (!disabled) {
            this.setState({isCustomTimeRangeOpen: !this.state.isCustomTimeRangeOpen})
        }
    }
    
    handleApplyCustomTimeRange = customTimeRange => {
        const {onStart} = this.props
        onStart(customTimeRange)
        this.setState({customTimeRange, isCustomTimeRangeOpen: false})
    }

    render() {
        const {
            isCustomTimeRangeOpen,
            customTimeRange,
        } = this.state

        const {
            startLabel,
            stopLabel,
            onStop,
            running,
            shortcuts,
            handleTimeRangeShortcut,
            disabled,
            now,
        } = this.props

        return (
            <div className="time-job--button">
                {running
                ?(<ConfirmButton
                        text={stopLabel}
                        confirmAction={onStop}
                        size="btn-xs"
                        disabled={disabled}
                        customClass="table--show-on-row-hover" />)
                :(<div className={classnames(
                    'dropdown',
                    'dropdown-110', {
                        'table--show-on-row-hover': !isCustomTimeRangeOpen,
                        open: isCustomTimeRangeOpen,
                    })}>
                    <div className="btn btn-xs btn-default dropdown-toggle"
                        onClick={this.toggleMenu}
                        disabled={disabled}>
                        <span className="icon clock" />
                        <span className="dropdown-selected">
                            {startLabel}
                        </span>
                        <span className="caret" />
                    </div>
                </div>)}
                {isCustomTimeRangeOpen
                    ?(<div className="custom-time--overlay">
                        <CustomTimeRange
                            onApplyTimeRange={this.handleApplyCustomTimeRange}
                            timeRange={customTimeRange}
                            onClose={this.handleClose}
                            shortcuts={shortcuts}
                            handleTimeRangeShortcut={handleTimeRangeShortcut}
                            now={now}
                        />
                    </div>)
                    : null}
            </div>
        )
    }
}

CustomTimeJobButton.defaultProps = {
    selected: {
        lower: null,
        upper: null,
    },
    disabled: false,
    now: 'upper',
}

const {string, func, bool, shape, arrayOf} = PropTypes

CustomTimeJobButton.propTypes = {
    startLabel: string.isRequired,
    stopLabel: string.isRequired,
    onStart: func.isRequired,
    onStop: func.isRequired,
    running: bool,
    selected: shape({
        lower: string,
        upper: string,
    }),
    shortcuts: arrayOf(shape({})),
    handleTimeRangeShortcut: func,
    disabled: bool,
    now: string.isRequired
}

export default OnClickOutside(CustomTimeJobButton)
