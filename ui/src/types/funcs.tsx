import {TimeSeries} from 'src/types/timeSeries'

import {Dygraph} from 'src/types'

export type grabDataForDownload = (celldata: TimeSeries[]) => void

export type editQueryStatus = (
  queryID: string,
  status: string
) => {
  type: string
  payload: {
    queryID: string
    status: string
  }
}

export type synchronizer = (dygraph: {}) => void

export type onZoom = (lower: string, upper: string) => void
