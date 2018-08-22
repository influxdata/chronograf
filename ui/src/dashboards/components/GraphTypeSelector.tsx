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
  parentPixels: number
}

@ErrorHandling
class GraphTypeSelector extends Component<Props> {
  public render() {
    const {type} = this.props

    return (
      <FancyScrollbar autoHide={false} className="graph-type-selector">
        <div className="graph-type-selector--container">
          <div className={this.gridClassName}>
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

  private get gridClassName(): string {
    const {parentPixels} = this.props

    const breakpoint0 = 0
    const breakpointA = 275
    const breakpointB = 550
    const breakpointC = 825
    const breakpointD = 1100
    const breakpointE = 1500
    const breakpointF = 1800

    return classnames('graph-type-selector--grid', {
      'graph-type-selector--1-cols':
        parentPixels >= breakpoint0 && parentPixels < breakpointA,
      'graph-type-selector--2-cols':
        parentPixels >= breakpointA && parentPixels < breakpointB,
      'graph-type-selector--3-cols':
        parentPixels >= breakpointB && parentPixels < breakpointC,
      'graph-type-selector--4-cols':
        parentPixels >= breakpointC && parentPixels < breakpointD,
      'graph-type-selector--5-cols':
        parentPixels >= breakpointD && parentPixels < breakpointE,
      'graph-type-selector--6-cols':
        parentPixels >= breakpointE && parentPixels < breakpointF,
      'graph-type-selector--8-cols': parentPixels >= breakpointF,
    })
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
