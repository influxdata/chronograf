import React from 'react'
import {PropTypes} from 'prop-types'

const RunningStatus = ({
    run,
}) => {
    if (run) {
        return (
            <code>Running.</code>
        )
    }

    return null
}

const {shape} = PropTypes

RunningStatus.propTypes = {
    run: shape({}),
}

export default RunningStatus
