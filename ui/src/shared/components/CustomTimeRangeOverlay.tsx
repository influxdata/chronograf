import * as React from 'react'
import * as PropTypes from 'prop-types'
import onClickOutside from 'react-onClickOutside'

import CustomTimeRange from 'shared/components/CustomTimeRange'

class CustomTimeRangeOverlay extends React.Component {
  constructor(props) {
    super(props)
  }

  handleClickOutside() {
    this.props.onClose()
  }

  render() {
    const {onClose, timeRange, onApplyTimeRange, page} = this.props

    return (
      <div className="custom-time--overlay">
        <CustomTimeRange
          onApplyTimeRange={onApplyTimeRange}
          timeRange={timeRange}
          onClose={onClose}
          page={page}
        />
      </div>
    )
  }
}

const {func, shape, string} = PropTypes

CustomTimeRangeOverlay.propTypes = {
  onApplyTimeRange: func.isRequired,
  timeRange: shape({
    lower: string.isRequired,
    upper: string,
  }).isRequired,
  onClose: func,
  page: string,
}

export default onClickOutside(CustomTimeRangeOverlay)
