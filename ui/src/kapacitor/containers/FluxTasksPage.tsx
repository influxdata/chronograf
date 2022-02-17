import React, {useEffect, useMemo, useState} from 'react'
import {FluxTask, Kapacitor, Source} from 'src/types'
import KapacitorScopedPage from './KapacitorScopedPage'
import {useDispatch} from 'react-redux'
import {
  deleteFluxTask,
  getFluxTasks,
  updateFluxTaskStatus,
} from '../apis/fluxTasks'
import errorMessage from '../utils/errorMessage'
import PageSpinner from 'src/shared/components/PageSpinner'
import FluxTasksTable from '../components/FluxTasksTable'
import {notify} from 'src/shared/actions/notifications'
import {
  notifyAlertRuleDeleted,
  notifyAlertRuleDeleteFailed,
  notifyFluxTaskStatusUpdated,
  notifyFluxTaskStatusUpdateFailed,
} from 'src/shared/copy/notifications'
import useDebounce from '../../utils/useDebounce'
import {Button, ButtonShape, IconFont} from 'src/reusable_ui'

const Contents = ({
  kapacitor,
  source,
}: {
  kapacitor: Kapacitor
  source: Source
}) => {
  const [loading, setLoading] = useState(true)
  const [reloadRequired, setReloadRequired] = useState(0)
  const [error, setError] = useState(undefined)
  const [allList, setAllList] = useState<FluxTask[] | null>(null)
  const dispatch = useDispatch()
  useEffect(() => {
    setLoading(true)
    const fetchData = async () => {
      try {
        const data = await getFluxTasks(kapacitor)
        setAllList(data)
      } catch (e) {
        if (e.status === 404) {
          setAllList(null)
        } else {
          console.error(e)
          setError(
            new Error(
              e?.data?.message
                ? e.data.message
                : `Cannot load flux task: ${errorMessage(e)}`
            )
          )
        }
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [kapacitor, reloadRequired])
  const [nameFilter, setNameFilter] = useState('')
  const filter = useDebounce(nameFilter)
  const list = useMemo(() => {
    if (allList && allList.length && filter) {
      return allList.filter(x => x.name.includes(filter))
    }
    return allList
  }, [allList, filter])

  if (error) {
    return (
      <div className="panel panel-solid">
        <div className="panel-body">
          <p className="unexpected_error">{error.toString()}</p>
        </div>
      </div>
    )
  }
  if (list === null) {
    return (
      <div className="panel panel-solid">
        <div className="panel-body">
          <p className="unexpected_error">
            No flux tasks are available. Kapacitor 1.6+ is required with Flux
            tasks enabled.
          </p>
        </div>
      </div>
    )
  }
  return (
    <div className="panel">
      <div className="panel-heading" style={{gap: '5px'}}>
        <div className="search-widget" style={{flexGrow: 1}}>
          <input
            type="text"
            className="form-control input-sm"
            placeholder="Filter by name"
            value={nameFilter}
            disabled={loading}
            onChange={e => {
              setNameFilter(e.target.value)
            }}
          />
          <span className="icon search" />
        </div>
        <Button
          titleText="Reload"
          shape={ButtonShape.Square}
          icon={IconFont.Refresh}
          onClick={() => setReloadRequired(reloadRequired + 1)}
        />
      </div>
      <div className="panel-body">
        {loading ? (
          <PageSpinner />
        ) : (
          <FluxTasksTable
            kapacitorLink={`/sources/${source.id}/kapacitors/${kapacitor.id}`}
            tasks={list}
            onDelete={(task: FluxTask) => {
              deleteFluxTask(kapacitor, task)
                .then(() => {
                  setAllList(allList.filter(x => x.id === task.id))
                  dispatch(notify(notifyAlertRuleDeleted(task.name)))
                })
                .catch(() => {
                  dispatch(notify(notifyAlertRuleDeleteFailed(task.name)))
                })
            }}
            onChangeTaskStatus={(task: FluxTask) => {
              const status = task.status === 'active' ? 'inactive' : 'active'
              updateFluxTaskStatus(kapacitor, task, status)
                .then(() => {
                  setAllList(
                    allList.map(x => (x.id === task.id ? {...task, status} : x))
                  )
                  dispatch(
                    notify(notifyFluxTaskStatusUpdated(task.name, status))
                  )
                })
                .catch(() => {
                  dispatch(
                    notify(notifyFluxTaskStatusUpdateFailed(task.name, status))
                  )
                  return false
                })
            }}
          />
        )}
      </div>
    </div>
  )
}

const FluxTasksPage = ({source: src}: {source: Source}) => {
  return (
    <KapacitorScopedPage source={src} title="Flux Tasks">
      {(kapacitor: Kapacitor, source: Source) => (
        <Contents kapacitor={kapacitor} source={source} />
      )}
    </KapacitorScopedPage>
  )
}

export default FluxTasksPage
