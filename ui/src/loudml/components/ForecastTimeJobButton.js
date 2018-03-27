import React from 'react'
import {PropTypes} from 'prop-types'

import moment from 'moment'

import CustomTimeJobButton from 'src/loudml/components/CustomTimeJobButton'

const forecastTimeRangeDefaults = [
    {
        id: 'thisWeek',
        name: 'This Week',
    },
    {
        id: 'thisMonth',
        name: 'This Month',
    },
    {
        id: 'thisYear',
        name: 'This Year',
    },
    {
        id: 'nextWeek',
        name: 'Next Week',
    },
    {
        id: 'nextMonth',
        name: 'Next Month',
    },
    {
        id: 'nextYear',
        name: 'Next Year',
    },
]
  
const ForecastTimeJobButton = ({
    startLabel,
    stopLabel,
    onStart,
    onStop,
    running,
    disabled,
}) => {
    function handleTimeRangeShortcut(shortcut) {
        const lower = moment()
        let upper
      
        switch (shortcut) {
            case 'nextWeek': {
                upper = moment().add(1, 'week')
                break
            }
            case 'nextMonth': {
                upper = moment().add(1, 'month')
                break
            }
            case 'nextYear': {
                upper = moment().add(1, 'year')
                break
            }
            case 'thisWeek': {
                upper = moment().endOf('week')
                break
            }
            case 'thisMonth': {
                upper = moment().endOf('month')
                break
            }
            case 'thisYear': {
                upper = moment().endOf('year')
                break
            }
        }
      
        return {
          lower,
          upper,
        }
      }
    
    return (
        <CustomTimeJobButton
            startLabel={startLabel}
            stopLabel={stopLabel}
            onStart={onStart}
            onStop={onStop}
            running={running}
            shortcuts={forecastTimeRangeDefaults}
            handleTimeRangeShortcut={handleTimeRangeShortcut}
            disabled={disabled}
            now="lower"
        />
    );
  }

ForecastTimeJobButton.propTypes = {
    startLabel: PropTypes.string,
    stopLabel: PropTypes.string,
    onStart: PropTypes.func,
    onStop: PropTypes.func,
    running: PropTypes.bool,
    disabled: PropTypes.bool,
}

export default ForecastTimeJobButton
