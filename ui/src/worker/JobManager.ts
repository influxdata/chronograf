import _ from 'lodash'
import idGenerator from 'uuid'
import Deferred from 'src/worker/Deferred'
import DB from './Database'
import {TimeSeriesServerResponse} from 'src/types/series'
import {DygraphValue} from 'src/types'
import {getBasepath} from 'src/utils/basepath'
import {TimeSeriesToTableGraphReturnType} from 'src/worker/jobs/timeSeriesToTableGraph'
import {TimeSeriesToDyGraphReturnType} from 'src/worker/jobs/timeSeriesToDygraph'

interface DecodeFluxRespWithLimitResult {
  body: string
  byteLength: number
  uuid?: string
}

const workerCount = navigator.hardwareConcurrency - 1

class JobManager {
  private currentIndex: number = 0
  private workers: Worker[] = []
  private jobs: {[key: string]: Deferred} = {}

  constructor() {
    _.times(workerCount, () => {
      const worker = new Worker('./worker.ts')

      worker.onmessage = this.handleMessage
      worker.onerror = this.handleError

      this.workers.push(worker)
    })
  }

  public async tableTransform(
    data,
    sort,
    fieldOptions,
    tableOptions,
    timeFormat,
    decimalPlaces
  ): Promise<any> {
    const payload = {
      data,
      sort,
      fieldOptions,
      tableOptions,
      timeFormat,
      decimalPlaces,
    }

    return this.publishDBJob('TABLETRANSFORM', payload)
  }

  public proxy(url, query, db, rp, uuid): Promise<any> {
    if (getBasepath() !== '') {
      url = `${getBasepath()}${url}`
    }
    return this.publishJob('PROXY', {url, query, db, rp, uuid})
  }

  public postJSON(url, body): Promise<any> {
    return this.publishDBJob('POSTJSON', {url, body})
  }

  public fetchFluxData(
    url: string,
    query: string,
    uuid: string,
    dialect?: {annotations: string[]}
  ): Promise<DecodeFluxRespWithLimitResult> {
    return this.publishDBJob('FETCHFLUXDATA', {url, query, uuid, dialect})
  }

  public get(url: string): Promise<any> {
    if (getBasepath() !== '') {
      url = `${getBasepath()}${url}`
    }
    return this.publishJob('GET', {url})
  }

  public timeSeriesToTableGraph = (
    raw: TimeSeriesServerResponse[]
  ): Promise<TimeSeriesToTableGraphReturnType> => {
    return this.publishDBJob('TSTOTABLEGRAPH', {raw})
  }

  public timeSeriesToDygraph = (
    raw: TimeSeriesServerResponse[],
    pathname: string = ''
  ): Promise<TimeSeriesToDyGraphReturnType> => {
    return this.publishDBJob('TSTODYGRAPH', {raw, pathname})
  }

  public validateDygraphData = (ts: DygraphValue[][]) => {
    return this.publishDBJob('VALIDATEDYGRAPHDATA', ts)
  }

  private handleMessage = async msg => {
    const {data} = msg
    const deferred = this.jobs[data.origin]
    if (deferred) {
      if (data.result === 'success') {
        this.fetchPayload(deferred, data.id)
      } else {
        deferred.reject(data.error)
      }
      delete this.jobs[data.origin]
    }
  }

  private fetchPayload = async (deferred, id) => {
    try {
      const payload = await DB.get(id)
      await DB.del(id)
      deferred.resolve(payload)
    } catch (e) {
      console.error(e)
      deferred.reject(e)
    }
  }

  private handleError = err => {
    console.error(err)
  }

  private get worker(): Worker {
    return this.workers[this.currentIndex]
  }

  private postMessage(msg: any): void {
    this.worker.postMessage(msg)
    this.incrementWorker()
  }

  private incrementWorker(): void {
    this.currentIndex += 1
    this.currentIndex %= workerCount
  }

  private publishJob = async (type, payload) => {
    const id = idGenerator.v1()
    const deferred = new Deferred()

    this.jobs[id] = deferred

    this.postMessage({id, type, payload})

    return deferred.promise
  }

  private publishDBJob = async (type, payload) => {
    const id = idGenerator.v1()
    const deferred = new Deferred()

    this.jobs[id] = deferred

    await DB.put(id, payload)

    this.postMessage({id, type})

    return deferred.promise
  }
}

export default JobManager
export const manager = new JobManager()
