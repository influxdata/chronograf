import React, {useEffect, useMemo, useState} from 'react'
import {AlertRule, Kapacitor, Source} from 'src/types'
import KapacitorScopedPage from './KapacitorScopedPage'
import {useDispatch} from 'react-redux'
import {deleteRule, getRules, updateRuleStatus} from '../apis/rules'
import errorMessage from '../utils/errorMessage'
import PageSpinner from 'src/shared/components/PageSpinner'
import {notify} from 'src/shared/actions/notifications'
import {
  notifyAlertRuleDeleted,
  notifyAlertRuleDeleteFailed,
  notifyAlertRuleStatusUpdated,
  notifyAlertRuleStatusUpdateFailed,
} from 'src/shared/copy/notifications'
import useDebounce from '../../utils/useDebounce'
import {Button, ButtonShape, IconFont} from 'src/reusable_ui'
import {isCancellationError} from 'src/types/promises'
import TasksTable from '../components/TasksTable'
import {Link} from 'react-router'

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
  const [allList, setAllList] = useState<AlertRule[]>([])
  const dispatch = useDispatch()
  useEffect(() => {
    setLoading(true)
    const ac = new AbortController()
    const fetchData = async () => {
      try {
        const {
          data: {rules},
        } = await getRules(kapacitor, {signal: ac.signal, params: {parse: '0'}})
        setAllList(rules)
      } catch (e) {
        if (!isCancellationError(e)) {
          console.error(e)
          setError(
            new Error(
              e?.data?.message
                ? e.data.message
                : `Cannot load alert rules: ${errorMessage(e)}`
            )
          )
        }
      } finally {
        setLoading(false)
      }
    }
    fetchData()
    return () => ac.abort()
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
  const kapacitorLink = `/sources/${source.id}/kapacitors/${kapacitor.id}`
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
          titleText="Reload Flux Tasks"
          shape={ButtonShape.Square}
          icon={IconFont.Refresh}
          onClick={() => setReloadRequired(reloadRequired + 1)}
        />
        <Link
          to={`${kapacitorLink}/tickscripts/new?l=t`}
          className="btn btn-sm btn-success"
          style={{marginLeft: '4px'}}
        >
          <span className="icon plus" /> Write TICKscript
        </Link>
      </div>
      <div className="panel-body">
        {loading ? (
          <PageSpinner />
        ) : (
          <TasksTable
            kapacitorLink={kapacitorLink}
            tasks={list}
            editLinkSuffix="?l=t"
            onDelete={(rule: AlertRule) => {
              deleteRule(rule)
                .then(() => {
                  setAllList(allList.filter(x => x.id !== rule.id))
                  dispatch(notify(notifyAlertRuleDeleted(rule.name)))
                })
                .catch(() => {
                  dispatch(notify(notifyAlertRuleDeleteFailed(rule.name)))
                })
            }}
            onChangeRuleStatus={(rule: AlertRule) => {
              const status = rule.status === 'enabled' ? 'disabled' : 'enabled'
              updateRuleStatus(rule, status)
                .then(() => {
                  setAllList(
                    allList.map(x => (x.id === rule.id ? {...rule, status} : x))
                  )
                  dispatch(
                    notify(notifyAlertRuleStatusUpdated(rule.name, status))
                  )
                })
                .catch(() => {
                  dispatch(
                    notify(notifyAlertRuleStatusUpdateFailed(rule.name, status))
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

const TickscriptsPage = ({source: src}: {source: Source}) => {
  return (
    <KapacitorScopedPage source={src} title="Manage TICKscripts">
      {(kapacitor: Kapacitor, source: Source) => (
        <Contents kapacitor={kapacitor} source={source} />
      )}
    </KapacitorScopedPage>
  )
}

export default TickscriptsPage
