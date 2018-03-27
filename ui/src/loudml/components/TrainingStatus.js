import React from 'react'
import {PropTypes} from 'prop-types'

import ProgressCode from 'src/loudml/components/ProgressCode'

const TrainingStatus = ({
    training,
}) => {
    if (training) {
        const {state, progress} = training
        if (state==='running') {
            return (
                <ProgressCode
                    max={(progress && progress.max_evals)||1}
                    value={(progress && progress.eval)||0}
                    label='Training' />
            )
        }
        return (
            <code>
                Training&nbsp;{state}.
            </code>
        )
    }
    return null
}

const {shape} = PropTypes

TrainingStatus.propTypes = {
    training: shape({}),
}

export default TrainingStatus