import React, {PureComponent} from 'react'
import {connect} from 'react-redux'
import ReactGridLayout, {WidthProvider} from 'react-grid-layout'
import {range} from 'd3-array'

import Cell from 'src/perf/components/Cell'
import NewCell from 'src/perf/components/NewCell'
import {Dropdown} from 'src/reusable_ui'

import QueryManager from 'src/perf/QueryManager'
import QueriesManager from 'src/perf/QueriesManager'

import {buildLayout} from 'src/perf/utils'

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
  numGraphs: number
  numColumns: number
  interval: string
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

    let localStorageState

    if (window.localStorage.perfTest) {
      localStorageState = JSON.parse(window.localStorage.perfTest)
    } else {
      localStorageState = {
        implementation: 'current',
        numGraphs: 6,
        numColumns: 2,
        interval: '1h',
      }
      window.localStorage.perfTest = JSON.stringify(localStorageState)
    }

    const layout = buildLayout(
      localStorageState.numColumns,
      localStorageState.numGraphs,
      localStorageState.interval
    )

    layout.forEach(
      cell => (cell.queryManager = this.queriesManager.addQuery(cell.query))
    )

    this.state = {
      ...localStorageState,
      layout,
    }
  }

  public render() {
    const {layout, implementation, numGraphs, numColumns, interval} = this.state

    return (
      <div className="perf-test-page">
        <div className="perf-test-page--header">
          <div className="lhs">
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
          <div className="rhs">
            <Dropdown
              selectedID={String(numGraphs)}
              onChange={this.handleChangeNumGraphs}
            >
              {range(1, 31).map(n => (
                <Dropdown.Item key={n} id={String(n)} value={n}>
                  {`${n} Graphs`}
                </Dropdown.Item>
              ))}
            </Dropdown>
            <Dropdown
              selectedID={String(numColumns)}
              onChange={this.handleChangeNumColumns}
            >
              {[1, 2, 3, 4, 6].map(n => (
                <Dropdown.Item key={n} id={String(n)} value={n}>
                  {`${n} Columns`}
                </Dropdown.Item>
              ))}
            </Dropdown>
            <Dropdown
              selectedID={interval}
              onChange={this.handleChangeInterval}
            >
              {['2s', '10s', '30s', '1m', '30m', '1h', '6h', '12h'].map(i => (
                <Dropdown.Item key={i} id={i} value={i}>
                  {i}
                </Dropdown.Item>
              ))}
            </Dropdown>
          </div>
        </div>
        <div className="perf-test-page--body">
          <GridLayout
            className="layout"
            layout={layout}
            cols={12}
            rowHeight={60}
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

  private setLayout() {
    const {numGraphs, numColumns, interval} = this.state
    const layout = buildLayout(numColumns, numGraphs, interval)

    layout.forEach(
      cell => (cell.queryManager = this.queriesManager.addQuery(cell.query))
    )

    this.setState({layout})
  }

  private handleChangeImplementation = implementation => {
    this.setState({implementation}, () => {
      this.saveToLocalStorage()
      this.setLayout()
    })
  }

  private handleChangeNumGraphs = numGraphs => {
    this.setState({numGraphs}, () => {
      this.saveToLocalStorage()
      this.setLayout()
    })
  }

  private handleChangeNumColumns = numColumns => {
    this.setState({numColumns}, () => {
      this.saveToLocalStorage()
      this.setLayout()
    })
  }

  private handleChangeInterval = interval => {
    this.setState({interval}, () => {
      this.saveToLocalStorage()
      this.setLayout()
    })
  }

  private saveToLocalStorage = () => {
    const {interval, implementation, numGraphs, numColumns} = this.state

    window.localStorage.perfTest = JSON.stringify({
      interval,
      implementation,
      numGraphs,
      numColumns,
    })
  }
}

const mstp = state => ({
  source: state.sources[0],
})

export default connect(mstp, null)(PerfTestPage)
