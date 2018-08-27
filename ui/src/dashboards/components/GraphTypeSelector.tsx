// Libraries
import React, {Component} from 'react'
import {connect} from 'react-redux'
import classnames from 'classnames'

// Components
import FancyScrollbar from 'src/shared/components/FancyScrollbar'

// Actions
import {changeCellType} from 'src/dashboards/actions/cellEditorOverlay'

// Constants
import {GRAPH_TYPES} from 'src/dashboards/graphics/graph'

// Decorators
import {ErrorHandling} from 'src/shared/decorators/errors'

interface Props {
  type: string
  handleChangeCellType: (newType: string) => void
}

@ErrorHandling
class GraphTypeSelector extends Component<Props> {
  public render() {
    const {type} = this.props

    return (
      <FancyScrollbar autoHide={false} className="graph-type-selector">
        <div className="graph-type-selector--container">
          <div className="graph-type-selector--grid">
            {GRAPH_TYPES.map(graphType => (
              <div
                key={graphType.type}
                className={classnames('graph-type-selector--option', {
                  active: graphType.type === type,
                })}
              >
                <div onClick={this.onChangeCellType(graphType.type)}>
                  {graphType.graphic}
                  <p>{graphType.menuOption}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </FancyScrollbar>
    )
  }

  private onChangeCellType = (newType: string) => (): void => {
    this.props.handleChangeCellType(newType)
  }
}

const mapStateToProps = ({
  cellEditorOverlay: {
    cell: {type},
  },
}) => ({
  type,
})

const mapDispatchToProps = {
  handleChangeCellType: changeCellType,
}

export default connect(mapStateToProps, mapDispatchToProps)(GraphTypeSelector)
