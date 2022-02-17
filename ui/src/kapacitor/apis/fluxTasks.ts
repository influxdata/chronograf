import AJAX from 'src/utils/ajax'
import _, {values} from 'lodash'
import {FluxTask, Kapacitor} from 'src/types'

const tasksBatchLimit = 500
export const getFluxTasks = async (
  kapacitor: Kapacitor
): Promise<FluxTask[]> => {
  const taskIds: Record<string, FluxTask> = {}
  let lastID = ''
  for (;;) {
    const {
      data: {tasks},
    } = await AJAX<{tasks: FluxTask[]}>({
      method: 'GET',
      url:
        kapacitor.links.proxy +
        '?path=' +
        encodeURIComponent(
          `/kapacitor/v1/api/v2/tasks?limit=${tasksBatchLimit}&after=${lastID}`
        ),
    })
    if (!tasks || !tasks.length) {
      break
    }
    lastID = tasks[tasks.length - 1].id
    let noNewData = true
    tasks.forEach(x => {
      if (taskIds[x.id]) {
        return
      }
      noNewData = false
      taskIds[x.id] = x
    })
    if (noNewData) {
      break
    }
    if (tasks.length < tasksBatchLimit) {
      // less data returned, last chunk
      break
    }
  }
  return values(taskIds).sort((a, b) => a.name.localeCompare(b.name))
}

export const getFluxTask = async (
  kapacitor: Kapacitor,
  taskID: string
): Promise<FluxTask> => {
  const {data} = await AJAX({
    method: 'GET',
    url: kapacitor.links.proxy + `?path=/kapacitor/v1/api/v2/tasks/${taskID}`,
  })
  return data
}

function friendlyID(id: number): string {
  if (id > 25) {
    return friendlyID(Math.trunc(id / 25)) + String.fromCharCode(id % 25)
  }
  return String.fromCharCode(65 + id)
}
export const getFluxTaskLogs = async (
  kapacitor: Kapacitor,
  taskID: string,
  maxItems: number
) => {
  const {data} = await AJAX({
    method: 'GET',
    url:
      kapacitor.links.proxy + `?path=/kapacitor/v1/api/v2/tasks/${taskID}/runs`,
  })
  const logs = []
  let nextClusterId = 0
  const runsById = {}
  _.each(_.get(data, ['runs'], []), run => {
    runsById[run.id] = {
      name: friendlyID(nextClusterId++),
      lvl: run.status === 'failed' ? 'error' : 'info',
    }
    _.each(run.log, l => logs.push(l))
  })

  logs.sort((a, b) => b.time.localeCompare(a.time))
  return logs.slice(0, maxItems).map(x => {
    const runDetail = runsById[x.runID]
    return {
      id: `${x.runID}-${x.time}`,
      key: `${x.runID}-${x.time}`,
      service: 'flux_task',
      lvl: runDetail.lvl,
      ts: x.time,
      msg: x.message,
      tags: x.runID,
      cluster: runDetail.name,
    }
  })
}

export const updateFluxTaskStatus = (
  kapacitor: Kapacitor,
  task: FluxTask,
  status: string
) => {
  return AJAX({
    method: 'PATCH',
    url: kapacitor.links.proxy + '?path=' + task.links.self,
    data: {status},
  })
}

export const deleteFluxTask = (kapacitor: Kapacitor, task: FluxTask) => {
  return AJAX({
    method: 'DELETE',
    url: kapacitor.links.proxy + '?path=' + task.links.self,
  })
}
