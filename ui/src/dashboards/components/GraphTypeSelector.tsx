// Libraries
import React, {Component} from 'react'
import classnames from 'classnames'

// Components
import FancyScrollbar from 'src/shared/components/FancyScrollbar'

// Constants
import {GRAPH_TYPES} from 'src/dashboards/graphics/graph'

// Decorators
import {ErrorHandling} from 'src/shared/decorators/errors'

// Types
import {CellType} from 'src/types/dashboards'

interface Props {
  type: string
  onUpdateVisType: (newType: CellType) => Promise<void>
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

  private onChangeCellType = (newType: CellType) => (): void => {
    this.props.onUpdateVisType(newType)
  }
}

export default GraphTypeSelector
