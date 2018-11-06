import React, {PureComponent, CSSProperties} from 'react'
import FancyScrollbar from './FancyScrollbar'

import {Button} from 'src/reusable_ui'

import {CellType} from 'src/types'
import {ComponentColor, ComponentSize} from 'src/reusable_ui/types'
import {TimeMachineContainer} from 'src/shared/utils/TimeMachineContainer'

interface Props {
  message?: string
  onUpdateVisType?: TimeMachineContainer['handleUpdateType']
}

class InvalidData extends PureComponent<Props> {
  public render() {
    return <div className="graph-empty">{this.errorMessage}</div>
  }

  private get errorMessage(): JSX.Element {
    if (this.props.message) {
      return (
        <div className="crazy-error">
          <span className="icon alert-triangle" />
          <FancyScrollbar
            className="crazy-error--scrollbox"
            autoHeight={true}
            maxHeight={400}
          >
            <p className="crazy-error--message" style={this.style}>
              {this.props.message}
            </p>
          </FancyScrollbar>
        </div>
      )
    }

    return (
      <p className="error-message">
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

  get style(): CSSProperties {
    const {message} = this.props
    if (message.length > 100) {
      return {fontSize: '13px'}
    }

    return {fontSize: '17px'}
  }
}

export default InvalidData
