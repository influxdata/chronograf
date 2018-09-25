import React, {PureComponent} from 'react'
import {Provider} from 'unstated'

import DataExplorer from './DataExplorer'

import {TimeMachineContainer} from 'src/shared/utils/TimeMachineContainer'
import {ErrorHandling} from 'src/shared/decorators/errors'

import {Source} from 'src/types'

interface Props {
  source: Source
}

@ErrorHandling
class DataExplorerPage extends PureComponent<Props> {
  private timeMachineContainer: TimeMachineContainer

  constructor(props: Props) {
    super(props)

    this.timeMachineContainer = new TimeMachineContainer()
  }

  public render() {
    return (
      <div className="page">
        <Provider inject={[this.timeMachineContainer]}>
          <DataExplorer source={this.props.source} />
        </Provider>
      </div>
    )
  }
}

export default DataExplorerPage
