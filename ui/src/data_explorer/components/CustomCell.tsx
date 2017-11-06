import * as React from 'react'
import * as PropTypes from 'prop-types'
import * as moment from 'moment'

const CustomCell = ({data, columnName}) => {
  if (columnName === 'time') {
    const date = moment(new Date(data)).format('MM/DD/YY hh:mm:ssA')

    return (
      <span>
        {date}
      </span>
    )
  }

  return (
    <span>
      {data}
    </span>
  )
}

const {number, oneOfType, string} = PropTypes

CustomCell.propTypes = {
  data: oneOfType([number, string]),
  columnName: string.isRequired,
}

export default CustomCell
