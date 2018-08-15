import React, {PureComponent} from 'react'
import uuid from 'uuid'
import {connect} from 'react-redux'
import ReactGridLayout, {WidthProvider} from 'react-grid-layout'

import Cell from 'src/perf/components/Cell'
import NewCell from 'src/perf/components/NewCell'
import {Dropdown} from 'src/reusable_ui'

import QueryManager from 'src/perf/QueryManager'
import QueriesManager from 'src/perf/QueriesManager'

import {QUERIES} from 'src/perf/constants'

import {Source} from 'src/types'

interface Props {
  source: Source
}

interface State {
  layout: Array<{
    i: string
    query: string
    queryManager: QueryManager
    x: number
    y: number
    w: number
    h: number
  }>
  implementation: 'current' | 'experiment'
}

const wsURL = `ws://${
  location.hostname
}:8889/chronograf/v1/sources/1/timeseries`
const GridLayout = WidthProvider(ReactGridLayout)

class PerfTestPage extends PureComponent<Props, State> {
  private queriesManager: QueriesManager

  constructor(props) {
    super(props)

    this.queriesManager = new QueriesManager(wsURL)

    const layout: any = []

    for (let i = 0; i < QUERIES.length; i++) {
      layout.push({
        query: QUERIES[i],
        queryManager: this.queriesManager.addQuery(QUERIES[i]),
        i: uuid.v4(),
        x: i % 2 === 0 ? 0 : 6,
        y: Math.ceil(i / 2),
        w: 6,
        h: 4,
      })
    }

    let implementation = window.localStorage.implementation

    if (!implementation) {
      implementation = 'current'
      window.localStorage.implementation = 'current'
    }

    this.state = {layout, implementation}
  }

  public render() {
    const {layout, implementation} = this.state

    return (
      <div className="perf-test-page">
        <div className="perf-test-page--header">
          <Dropdown
            selectedID={implementation}
            onChange={this.handleChangeImplementation}
          >
            <Dropdown.Item id={'current'} value={'current'}>
              Current
            </Dropdown.Item>
            <Dropdown.Item id={'experiment'} value={'experiment'}>
              Experimental
            </Dropdown.Item>
          </Dropdown>
        </div>
        <div className="perf-test-page--body">
          <GridLayout
            className="layout"
            layout={layout}
            cols={12}
            rowHeight={50}
            measureBeforeMount={true}
            draggableHandle={'.perf-test-page--draggable'}
          >
            {this.cells}
          </GridLayout>
        </div>
      </div>
    )
  }

  private get cells() {
    const {source} = this.props
    const {layout, implementation} = this.state

    if (implementation === 'current') {
      return layout.map(cell => (
        <div key={cell.i}>
          <Cell query={cell.query} source={source} />
        </div>
      ))
    }

    return layout.map(cell => (
      <div key={cell.i}>
        <NewCell queryManager={cell.queryManager} />
      </div>
    ))
  }

  private handleChangeImplementation = implementation => {
    this.setState({implementation})
    window.localStorage.implementation = implementation
  }
}

const mstp = state => ({
  source: state.sources[0],
})

export default connect(mstp, null)(PerfTestPage)
