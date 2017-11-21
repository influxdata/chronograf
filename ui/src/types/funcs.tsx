import {RawResponse} from 'src/types/timeSeries'

import {Dygraph, Message} from 'src/types'

export type grabDataForDownload = (celldata: RawResponse[]) => void

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

export type addFlashMessage = (message: Message) => void

export type notify = (type: string, message: string) => void

export type func = () => void

export type linkFunc = (link: string) => void

export type eReturnFunc = (e: {}) => func

export type eFunc = (e: {}) => void
