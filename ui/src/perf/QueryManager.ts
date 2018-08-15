import QueriesManager from 'src/perf/QueriesManager'

import {ScaleLinear} from 'd3-scale'

export type Event = 'FETCHING_DATA' | 'FETCHED_DATA'

type Subscriber = (e: Event) => void

export default class QueryManager {
  public query: string

  private queriesManager: QueriesManager
  private subscribers: Set<Subscriber>
  private data: {
    [column: string]: Float32Array | Float64Array
  }

  constructor(query: string, queriesManager: QueriesManager) {
    this.query = query
    this.queriesManager = queriesManager
    this.subscribers = new Set()
    this.data = {}
  }

  public subscribe(subscriber: Subscriber): void {
    this.subscribers.add(subscriber)
  }

  public unsubscribe(subscriber: Subscriber): void {
    this.subscribers.delete(subscriber)
  }

  public getTimeseries(): {[column: string]: Float32Array | Float64Array} {
    return this.data
  }

  public refetch() {
    this.publish('FETCHING_DATA')
    this.queriesManager.send(this)
  }

  public downsample(
    xScale: ScaleLinear<number, number>,
    yScale: ScaleLinear<number, number>
  ): void {}

  public addColumnData(
    column: string,
    data: Float32Array | Float64Array,
    isLastColumn: boolean
  ) {
    this.data[column] = data

    if (isLastColumn) {
      this.publish('FETCHED_DATA')
    }
  }

  private publish(e: Event): void {
    this.subscribers.forEach(s => s.call(s, e))
  }
}
