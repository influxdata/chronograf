import * as React from 'react'
import * as PropTypes from 'prop-types'

const KapacitorTasksPage = () => <div className="kapacitorTasks">tasks</div>

KapacitorTasksPage.propTypes = {
  source: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired, // 'influx-enterprise'
    username: PropTypes.string.isRequired,
    links: PropTypes.shape({
      kapacitors: PropTypes.string.isRequired,
    }).isRequired,
  }).isRequired,
  addFlashMessage: PropTypes.func,
}

export default KapacitorTasksPage
