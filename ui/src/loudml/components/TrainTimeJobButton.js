import React from 'react'
import {PropTypes} from 'prop-types'

import CustomTimeJobButton from 'src/loudml/components/CustomTimeJobButton'

const TrainTimeJobButton = ({
    startLabel,
    stopLabel,
    onStart,
    onStop,
    running,
}) => {
    
    return (
        <CustomTimeJobButton
            startLabel={startLabel}
            stopLabel={stopLabel}
            onStart={onStart}
            onStop={onStop}
            running={running}
        />
    );
  }

TrainTimeJobButton.propTypes = {
    startLabel: PropTypes.string,
    stopLabel: PropTypes.string,
    onStart: PropTypes.func,
    onStop: PropTypes.func,
    running: PropTypes.bool,
}

export default TrainTimeJobButton
