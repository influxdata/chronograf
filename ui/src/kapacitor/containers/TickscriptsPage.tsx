import React, {useEffect, useMemo, useRef, useState} from 'react'
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
import {Button, ButtonShape, IconFont, PaginationBar} from 'src/reusable_ui'
import {isCancellationError} from 'src/types/promises'
import TasksTable from '../components/TasksTable'
import {Link} from 'react-router'
import {sortBy} from 'lodash'

// max size of a limited fetch
const LIMITED_FETCH_SIZE = 100
const PAGE_SIZE = LIMITED_FETCH_SIZE

const Contents = ({
  kapacitor,
  source,
  filter: filterInit = '',
  router,
}: {
  kapacitor: Kapacitor
  source: Source
  router: Router
  filter?: string
}) => {
  const [loading, setLoading] = useState(true)
  const [reloadRequired, setReloadRequired] = useState(0)
  const [error, setError] = useState(undefined)
  const [allList, setAllList] = useState<AlertRule[]>([])
  const dispatch = useDispatch()
  const [nameFilter, setNameFilter] = useState(filterInit)
  const filter = useDebounce(nameFilter)
  const list = useMemo(() => {
    if (allList && allList.length && filter) {
      return allList.filter(x => x.name.includes(filter))
    }
    return allList
  }, [allList, filter])
  // optimization: limit fetch if no filter is specified
  const loadAllData = useRef(false)
  const limitedFetch = useMemo(() => {
    if (loadAllData.current) {
      return false
    }
    if (filter) {
      loadAllData.current = true
      return false
    }
    return true
  }, [filter, reloadRequired])
  const [page, setPage] = useState(0)
  const listPage = useMemo(() => {
    if (list.length <= PAGE_SIZE) {
      return list
    }
    const start = Math.max(page * PAGE_SIZE, 0)
    return list.slice(start, Math.min(start + PAGE_SIZE, list.length))
  }, [page, list])

  useEffect(() => {
    setLoading(true)
    const ac = new AbortController()
    const fetchData = async () => {
      const params: Record<string, string> = {
        parse: '0',
        ...(limitedFetch ? {limit: String(LIMITED_FETCH_SIZE)} : undefined),
      }
      try {
        const {
          data: {rules},
        } = await getRules(kapacitor, {signal: ac.signal, params})
        const sorted = sortBy(rules, t => t.name.toLowerCase())
        setAllList(sorted)
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
  }, [kapacitor, reloadRequired, limitedFetch])

  if (error) {
    return (
      <div className="panel panel-solid">
        <div className="panel-body">
          <p className="unexpected_error">{error.toString()}</p>
        </div>
      </div>
    )
  }
  const kapacitorLink = useMemo(
    () => `/sources/${source.id}/kapacitors/${kapacitor.id}`,
    [source, kapacitor]
  )
  // memoize table handlers in order to avoid re-rendering of table rows
  const onDelete = useMemo(
    () => (rule: AlertRule) => {
      deleteRule(rule)
        .then(() => {
          setAllList(allList.filter(x => x.id !== rule.id))
          dispatch(notify(notifyAlertRuleDeleted(rule.name)))
        })
        .catch(() => {
          dispatch(notify(notifyAlertRuleDeleteFailed(rule.name)))
        })
    },
    [allList, dispatch]
  )
  const onChangeRuleStatus = useMemo(
    () => (rule: AlertRule) => {
      const status = rule.status === 'enabled' ? 'disabled' : 'enabled'
      updateRuleStatus(rule, status)
        .then(() => {
          setAllList(
            allList.map(x => (x.id === rule.id ? {...rule, status} : x))
          )
          dispatch(notify(notifyAlertRuleStatusUpdated(rule.name, status)))
        })
        .catch(() => {
          dispatch(notify(notifyAlertRuleStatusUpdateFailed(rule.name, status)))
          return false
        })
    },
    [allList, dispatch]
  )
  const filterRef = useRef<HTMLInputElement>()
  const onViewRule = useMemo(
    () => (id: string) => {
      const params = new URLSearchParams({
        l: 't', // inform view page to return back herein
        filter: filterRef.current.value,
      })
      router.push(`${kapacitorLink}/tickscripts/${id}?${params}`)
    },
    [dispatch, kapacitorLink]
  )

  return (
    <div className="panel">
      <div className="panel-heading" style={{gap: '5px'}}>
        <div className="search-widget" style={{flexGrow: 1}}>
          <input
            ref={filterRef}
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
          to={`${kapacitorLink}/tickscripts/new?l=t&filter=${encodeURIComponent(
            filter
          )}`}
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
          <>
            {limitedFetch && list.length === LIMITED_FETCH_SIZE ? (
              <div
                style={{
                  display: 'inline-flex',
                  justifyContent: 'center',
                  color: '#FFB94A',
                  width: '100%',
                }}
              >
                <span>
                  {`${LIMITED_FETCH_SIZE} kapacitor tasks are shown, which are then sorted by name. Input a filter or `}
                  <a
                    href="#"
                    onClick={() => {
                      loadAllData.current = true
                      setReloadRequired(reloadRequired + 1)
                    }}
                  >
                    Load All
                  </a>
                  {' to show the first 100 tasks sorted by name.'}
                </span>
              </div>
            ) : undefined}
            <TasksTable
              kapacitorLink={kapacitorLink}
              tasks={listPage}
              sorted={true}
              onViewRule={onViewRule}
              onDelete={onDelete}
              onChangeRuleStatus={onChangeRuleStatus}
            >
              {listPage !== list ? (
                <PaginationBar
                  page={page}
                  total={list.length}
                  pageSize={PAGE_SIZE}
                  onChange={p => setPage(p)}
                />
              ) : undefined}
            </TasksTable>
          </>
        )}
      </div>
    </div>
  )
}

interface Router {
  location: {
    query?: Record<string, string>
  }
  push: (location: string) => void
}
interface Props {
  source: Source
  router: Router
}

const TickscriptsPage = ({source: src, router}: Props) => {
  const filter = router.location.query?.filter
  return (
    <KapacitorScopedPage source={src} title="Manage TICKscripts">
      {(kapacitor: Kapacitor, source: Source) => (
        <Contents
          kapacitor={kapacitor}
          source={source}
          filter={filter}
          router={router}
        />
      )}
    </KapacitorScopedPage>
  )
}

export default TickscriptsPage
