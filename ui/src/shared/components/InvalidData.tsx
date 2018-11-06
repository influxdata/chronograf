import React, {PureComponent} from 'react'

import {Button} from 'src/reusable_ui'

import {CellType} from 'src/types'
import {ComponentColor, ComponentSize} from 'src/reusable_ui/types'

interface Props {
  message?: string
  onUpdateVisType?: (cell: CellType) => Promise<void>
}

class InvalidData extends PureComponent<Props> {
  public render() {
    return <div className="graph-empty">{this.errorMessage}</div>
  }

  private get errorMessage(): JSX.Element {
    if (this.props.message) {
      return <p>{this.props.message}</p>
    }

    return (
      <p>
        The data returned from the query can't be visualized with this graph
        type.<br />
        {this.props.onUpdateVisType && (
          <>
            <br />
            <Button
              text={'Switch to Table Graph'}
              onClick={this.handleSwitchToTableGraph}
              color={ComponentColor.Primary}
              size={ComponentSize.Small}
            />
          </>
        )}
      </p>
    )
  }

  private handleSwitchToTableGraph = () => {
    this.props.onUpdateVisType(CellType.Table)
  }
}

export default InvalidData
