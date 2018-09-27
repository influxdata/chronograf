import React, {PureComponent} from 'react'
import {Provider} from 'unstated'

import DataExplorer from './DataExplorer'

import {TimeMachineContainer} from 'src/shared/utils/TimeMachineContainer'
import {ErrorHandling} from 'src/shared/decorators/errors'
import {DE_LOCAL_STORAGE_KEY} from 'src/data_explorer/constants'

import {Source} from 'src/types'

interface Props {
  source: Source
}

@ErrorHandling
class DataExplorerPage extends PureComponent<Props> {
  private timeMachineContainer: TimeMachineContainer

  constructor(props: Props) {
    super(props)

    this.timeMachineContainer = new TimeMachineContainer(
      {},
      DE_LOCAL_STORAGE_KEY
    )
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
