import React from 'react'
import {PropTypes} from 'prop-types'

import 'src/loudml/styles/progress.scss'

const ProgressCode = ({
    label,
    color,
    max,
    value,
}) => {

    function borderStyle() {
        const percent = Math.floor(value*100/max)

        return `linear-gradient(90deg, ${color} ${percent}%, transparent 0%) 2`
    }

    return (
        <code style={{
            borderBottom: '2px solid',
            borderImage: borderStyle(),
        }}>
            {label}&nbsp;running.
        </code>
    )
}

ProgressCode.defaultProps = {
    color: '#22ADF6',    
}

ProgressCode.propTypes = {
    label: PropTypes.string.isRequired,
    color: PropTypes.string,
    max: PropTypes.number.isRequired,
    value: PropTypes.number.isRequired,
}

export default ProgressCode
