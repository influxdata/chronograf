import React from 'react'
import {PropTypes} from 'prop-types'

const JobStatus = ({
    jobs,
}) => {
    return (
        <div>
            {jobs
                .filter(job => job.type==='forecast')
                .map(job => (
                    <code key={job.id}>
                        {job.type}&nbsp;{job.state}
                    </code>)
                )
            }
        </div>
    )
}

const {shape, arrayOf} = PropTypes

JobStatus.propTypes = {
    jobs: arrayOf(shape({})).isRequired,
}

export default JobStatus
