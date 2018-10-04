import React, {PureComponent} from 'react'

import DataExplorer from './DataExplorer'

import {ErrorHandling} from 'src/shared/decorators/errors'

import {Source} from 'src/types'

interface Props {
  source: Source
}

@ErrorHandling
class DataExplorerPage extends PureComponent<Props> {
  public render() {
    return (
      <div className="page">
        <DataExplorer source={this.props.source} />
      </div>
    )
  }
}

export default DataExplorerPage
