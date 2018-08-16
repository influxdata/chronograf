import QueriesManager from 'src/perf/QueriesManager'
import {simplify} from 'src/perf/simplify'

import {Timeseries, Scale} from 'src/perf/types'

export type Event = 'FETCHING_DATA' | 'FETCHED_DATA' | 'SIMPLIFIED_DATA'

type Subscriber = (e: Event) => void

const SIMPLIFICATION_TOLERANCE = 1.5

export default class QueryManager {
  public query: string

  private queriesManager: QueriesManager
  private subscribers: Set<Subscriber>
  private rawTimes?: Float64Array
  private rawValues?: Float32Array[]
  private resetValues: boolean
  private data: Timeseries[]

  constructor(query: string, queriesManager: QueriesManager) {
    this.query = query
    this.queriesManager = queriesManager
    this.subscribers = new Set()
    this.resetValues = true
  }

  public subscribe(subscriber: Subscriber): void {
    this.subscribers.add(subscriber)
  }

  public unsubscribe(subscriber: Subscriber): void {
    this.subscribers.delete(subscriber)
  }

  public getTimeseries(): Timeseries[] {
    return this.data
  }

  public getRawTimeseries(): Timeseries[] {
    if (!this.rawValues) {
      return
    }

    return this.rawValues.map<Timeseries>(values => [this.rawTimes, values])
  }

  public refetch() {
    this.publish('FETCHING_DATA')
    this.resetValues = true
    this.queriesManager.send(this)
  }

  public simplify(xScale: Scale, yScale: Scale): void {
    this.data = this.rawValues.map(values =>
      simplify(this.rawTimes, values, SIMPLIFICATION_TOLERANCE, xScale, yScale)
    )

    this.publish('SIMPLIFIED_DATA')
  }

  public addColumnData(
    column: string,
    data: Float32Array | Float64Array,
    isLastColumn: boolean
  ) {
    if (column === 'time') {
      this.rawTimes = data as Float64Array
    } else {
      if (this.resetValues) {
        this.rawValues = []
        this.resetValues = false
      }

      this.rawValues.push(data as Float32Array)
    }

    if (isLastColumn) {
      this.publish('FETCHED_DATA')
    }
  }

  private publish(e: Event): void {
    this.subscribers.forEach(s => s.call(s, e))
  }
}
