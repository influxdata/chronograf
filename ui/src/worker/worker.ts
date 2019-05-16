import 'babel-polyfill'
import _ from 'lodash'
import {error, success} from 'src/worker/utils'

import {Message} from 'src/worker/types'

interface WorkerMessage {
  data: Message
}

import timeSeriesToTableGraph from 'src/worker/jobs/timeSeriesToTableGraph'
import timeSeriesToDygraph from 'src/worker/jobs/timeSeriesToDygraph'
import proxy from 'src/worker/jobs/proxy'
import get from 'src/worker/jobs/get'
import tableTransform from 'src/worker/jobs/tableTransform'
import validateDygraphData from 'src/worker/jobs/validateDygraphData'
import postJSON from 'src/worker/jobs/postJSON'
import fluxTablesToDygraph from 'src/worker/jobs/fluxTablesToDygraph'
import fluxTablesToSingleStat from 'src/worker/jobs/fluxTablesToSingleStat'

type Job = (msg: Message) => Promise<any>

const jobMapping: {[key: string]: Job} = {
  GET: get,
  PROXY: proxy,
  POSTJSON: postJSON,
  TABLETRANSFORM: tableTransform,
  TSTOTABLEGRAPH: timeSeriesToTableGraph,
  TSTODYGRAPH: timeSeriesToDygraph,
  VALIDATEDYGRAPHDATA: validateDygraphData,
  FLUXTODYGRAPH: fluxTablesToDygraph,
  FLUXTOSINGLE: fluxTablesToSingleStat,
}

const errorJob = async (data: Message) => {
  error(data, new Error('UNKNOWN JOB TYPE'))
}

onmessage = async (workerMessage: WorkerMessage) => {
  const {data} = workerMessage
  const job: Job = _.get(jobMapping, data.type, errorJob)

  try {
    const result = await job(data)
    success(data, result)
  } catch (e) {
    error(data, e)
  }
}
