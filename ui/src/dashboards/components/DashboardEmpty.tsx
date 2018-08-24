// Libraries
import React, {Component} from 'react'
import {Cell} from 'src/types/dashboards'
import {connect} from 'react-redux'
import {bindActionCreators} from 'redux'

// Utils
import {getNewDashboardCell} from 'src/dashboards/utils/cellGetters'

// Types
import {Dashboard} from 'src/types'
import {addDashboardCellAsync} from 'src/dashboards/actions'
import {ErrorHandling} from 'src/shared/decorators/errors'
import {GRAPH_TYPES} from 'src/dashboards/graphics/graph'
import {NewDefaultCell} from 'src/types/dashboards'

// Constants
import Authorized, {EDITOR_ROLE} from 'src/auth/Authorized'

interface Props {
  dashboard: Dashboard
  addDashboardCell: (dashboard: Dashboard, cell?: Cell | NewDefaultCell) => void
}

const mapDispatchToProps = dispatch => ({
  addDashboardCell: bindActionCreators(addDashboardCellAsync, dispatch),
})

@ErrorHandling
@connect(null, mapDispatchToProps)
class DashboardEmpty extends Component<Props> {
  constructor(props) {
    super(props)
  }

  public handleAddCell = type => () => {
    const {dashboard, addDashboardCell} = this.props
    const emptyCell = getNewDashboardCell(dashboard)
    emptyCell.type = type

    addDashboardCell(dashboard, emptyCell)
  }

  public render() {
    return (
      <div className="dashboard-empty">
        <p>
          This Dashboard doesn't have any <strong>Cells</strong>,<br />why not
          add one?
        </p>
        <Authorized requiredRole={EDITOR_ROLE}>
          <div className="dashboard-empty--menu">
            {GRAPH_TYPES.map(graphType => (
              <div
                key={graphType.type}
                className="dashboard-empty--menu-option"
              >
                <div onClick={this.handleAddCell(graphType.type)}>
                  {graphType.graphic}
                  <p>{graphType.menuOption}</p>
                </div>
              </div>
            ))}
          </div>
        </Authorized>
      </div>
    )
  }
}

export default DashboardEmpty
