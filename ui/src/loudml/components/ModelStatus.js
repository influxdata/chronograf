import React from 'react'
import {PropTypes} from 'prop-types'

import RunningStatus from 'src/loudml/components/RunningStatus'
import TrainingStatus from 'src/loudml/components/TrainingStatus'
import JobStatus from 'src/loudml/components/JobStatus'

import 'src/loudml/styles/status.scss'

const ModelStatus = ({
    model: {
        settings: {
            run,
        },
        training,
    },
    jobs,
}) => {
    return (
        <div className="status">
            <RunningStatus run={run} />
            <TrainingStatus training={training} />
            <JobStatus jobs={jobs} />
        </div>
    )
}

const {shape, arrayOf} = PropTypes

ModelStatus.propTypes = {
    model: shape({}).isRequired,
    jobs: arrayOf(shape({})),
}

export default ModelStatus
