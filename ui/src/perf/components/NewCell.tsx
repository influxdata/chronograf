import React, {PureComponent} from 'react'
import {ParentSize} from '@vx/responsive'

import QueryManager from 'src/perf/QueryManager'
import Vis from 'src/perf/components/Vis'

interface Props {
  queryManager: QueryManager
}

class NewCell extends PureComponent<Props> {
  public render() {
    const {queryManager} = this.props

    return (
      <div className="perf-cell">
        <div className="perf-cell--header perf-test-page--draggable" />
        <div className="perf-cell--body">
          <ParentSize className="perf-cell--vis" debounceTime={0}>
            {({width, height}) => (
              <Vis queryManager={queryManager} width={width} height={height} />
            )}
          </ParentSize>
        </div>
      </div>
    )
  }
}

export default NewCell
