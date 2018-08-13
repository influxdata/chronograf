import React, {PureComponent} from 'react'
import uuid from 'uuid'
import {connect} from 'react-redux'
import ReactGridLayout, {WidthProvider} from 'react-grid-layout'

import Cell from 'src/perf/components/Cell'

import {QUERIES} from 'src/perf/constants'

import {Source} from 'src/types'

interface Props {
  source: Source
}

interface State {
  layout: Array<{
    i: string
    query: string
    x: number
    y: number
    w: number
    h: number
  }>
}

const GridLayout = WidthProvider(ReactGridLayout)

class PerfTestPage extends PureComponent<Props, State> {
  constructor(props) {
    super(props)

    const layout: any = []

    for (let i = 0; i < QUERIES.length; i++) {
      layout.push({
        query: QUERIES[i],
        i: uuid.v4(),
        x: i % 2 === 0 ? 0 : 6,
        y: Math.ceil(i / 2),
        w: 6,
        h: 4,
      })
    }

    this.state = {layout}
  }

  public render() {
    const {source} = this.props
    const {layout} = this.state

    return (
      <div className="perf-test-page">
        <div className="perf-test-page--header" />
        <div className="perf-test-page--body">
          <GridLayout
            className="layout"
            layout={layout}
            cols={12}
            rowHeight={50}
            measureBeforeMount={true}
            draggableHandle={'.perf-test-page--draggable'}
          >
            {layout.map(cell => (
              <div key={cell.i}>
                <Cell query={cell.query} source={source} />
              </div>
            ))}
          </GridLayout>
        </div>
      </div>
    )
  }
}

const mstp = state => ({
  source: state.sources[0],
})

export default connect(mstp, null)(PerfTestPage)
