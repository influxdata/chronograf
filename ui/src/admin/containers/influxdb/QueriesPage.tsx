import React, {Component} from 'react'
import {connect, ResolveThunks} from 'react-redux'
import {withSource} from 'src/CheckSources'

import flatten from 'lodash/flatten'
import uniqBy from 'lodash/uniqBy'

import {showDatabases, showQueries} from 'src/shared/apis/metaQuery'

import QueriesTable from 'src/admin/components/QueriesTable'
import showDatabasesParser from 'src/shared/parsing/showDatabases'
import showQueriesParser from 'src/shared/parsing/showQueries'
import {notifyQueriesError} from 'src/shared/copy/notifications'
import {ErrorHandling} from 'src/shared/decorators/errors'
import AutoRefreshDropdown from 'src/shared/components/dropdown_auto_refresh/AutoRefreshDropdown'

import {
  loadQueries as loadQueriesAction,
  setQueryToKill as setQueryToKillAction,
  setQueriesSort as setQueriesSortAction,
  killQueryAsync,
} from 'src/admin/actions/influxdb'

import {notify as notifyAction} from 'src/shared/actions/notifications'
import {Button, IconFont, ComponentStatus} from 'src/reusable_ui'
import moment from 'moment'
import FormElementError from 'src/reusable_ui/components/form_layout/FormElementError'
import {Source} from 'src/types'
import {QueryStat} from 'src/types/influxAdmin'
import AdminInfluxDBTabbedPage from './AdminInfluxDBTabbedPage'
import FancyScrollbar from 'src/shared/components/FancyScrollbar'

interface OwnProps {
  source: Source
}
interface ConnectedProps {
  queriesSort: string
  queryIDToKill?: string
  queries: QueryStat[]
}

type ReduxDispatchProps = ResolveThunks<typeof mapDispatchToProps>
type Props = OwnProps & ConnectedProps & ReduxDispatchProps

interface State {
  updateInterval: number
  errors: any[]
  title: string
}

class QueriesPage extends Component<Props, State> {
  private intervalID: ReturnType<typeof setInterval>
  constructor(props: Props) {
    super(props)
    this.state = {
      updateInterval: 5000,
      errors: [],
      title: '',
    }
  }
  componentDidMount() {
    this.updateQueries()
    if (this.state.updateInterval > 0) {
      this.intervalID = setInterval(
        this.updateQueries,
        this.state.updateInterval
      )
    }
  }

  componentWillUnmount() {
    if (this.intervalID) {
      clearInterval(this.intervalID)
    }
  }

  render() {
    const {queries, queriesSort, changeSort, source} = this.props
    const {updateInterval, title, errors} = this.state

    return (
      <AdminInfluxDBTabbedPage activeTab="queries" source={source}>
        <div className="panel panel-solid influxdb-admin">
          <div className="panel-heading">
            <h2 className="panel-title">{title}</h2>
            <div className="panel-heading--right">
              {queries && queries.length ? (
                <div style={{marginRight: '5px'}}>
                  <Button
                    customClass="csv-export"
                    text="CSV"
                    icon={IconFont.Download}
                    status={ComponentStatus.Default}
                    onClick={this.downloadCSV}
                  />
                </div>
              ) : null}
              <AutoRefreshDropdown
                selected={updateInterval}
                onChoose={this.changeRefreshInterval}
                onManualRefresh={this.updateQueries}
                showManualRefresh={true}
              />
            </div>
          </div>
          <div className="panel-body">
            <FancyScrollbar>
              {queries && queries.length ? (
                <QueriesTable
                  queries={queries}
                  queriesSort={queriesSort}
                  changeSort={changeSort}
                  onKillQuery={this.handleKillQuery}
                />
              ) : null}
              {errors.length ? (
                <div style={{marginTop: '5px'}}>
                  {errors.map((e, i) => (
                    <div key={`error${i}`}>
                      <FormElementError message={e} />
                    </div>
                  ))}
                </div>
              ) : null}
            </FancyScrollbar>
          </div>
        </div>
      </AdminInfluxDBTabbedPage>
    )
  }

  updateQueries = () => {
    const {source, notify, loadQueries} = this.props
    const dbErrors = []
    showDatabases(source.links.proxy)
      .then(resp => {
        const {databases, errors} = showDatabasesParser(resp.data)
        if (errors.length) {
          this.setState(state => ({...state, title: ''}))
          errors.forEach(message => notify(notifyQueriesError(message)))
          return
        }
        this.setState(state => ({
          ...state,
          title:
            databases.length === 1
              ? '1 Database'
              : `${databases.length} Databases`,
        }))

        const fetches = databases.map(db => showQueries(source.links.proxy, db))

        return Promise.allSettled(fetches).then(results => {
          const allQueries = []
          results.forEach((settledResponse, i) => {
            if (settledResponse.status !== 'fulfilled') {
              const msg = `Unable to show queries on '${databases[i]}': ${settledResponse.reason}`
              dbErrors.push(msg)
              console.error(
                'Unable to show queries',
                databases[i],
                settledResponse.reason
              )
              return
            }
            const result = showQueriesParser(settledResponse.value.data)
            if (result.errors.length) {
              result.errors.forEach(message =>
                notify(notifyQueriesError(message))
              )
            }

            allQueries.push(...result.queries)
          })

          const queries = uniqBy(flatten(allQueries), q => q.id)
          loadQueries(queries)
        })
      })
      .catch(e => {
        dbErrors.push(`Unable to show databases: ${e}`)
        console.error('Unable to show databases', e)
      })
      .then(() => this.setState({errors: dbErrors}))
  }
  changeRefreshInterval = ({milliseconds: updateInterval}) => {
    this.setState(state => ({...state, updateInterval}))
    if (this.intervalID) {
      clearInterval(this.intervalID)
      this.intervalID = undefined
    }
    if (updateInterval > 0) {
      this.updateQueries()
      this.intervalID = setInterval(this.updateQueries, updateInterval)
    }
  }

  handleKillQuery = query => {
    const {source, killQuery} = this.props
    killQuery(source.links.proxy, query)
  }

  downloadCSV = () => {
    const queries = this.props.queries || []
    const csv = queries.reduce((acc, val) => {
      const db = val.database.replace(/"/g, '""')
      const query = val.query.replace(/"/g, '""')
      return `${acc}"${db}","${query}",${val.duration},${val.status}${'\n'}`
    }, 'database,query,duration,status\n')
    const blob = new Blob([csv], {type: 'text/csv'})
    const a = document.createElement('a')

    a.href = window.URL.createObjectURL(blob)
    a.target = '_blank'
    a.download = `${moment().format(
      'YYYY-MM-DD-HH-mm-ss'
    )} Chronograf Queries.csv`

    document.body.appendChild(a)
    a.click()
    a.parentNode.removeChild(a)
  }
}

const mapStateToProps = ({
  adminInfluxDB: {queries, queriesSort, queryIDToKill},
}) => ({
  queries,
  queriesSort,
  queryIDToKill,
})

const mapDispatchToProps = {
  loadQueries: loadQueriesAction,
  setQueryToKill: setQueryToKillAction,
  changeSort: setQueriesSortAction,
  killQuery: killQueryAsync,
  notify: notifyAction,
}

export default withSource(
  connect(mapStateToProps, mapDispatchToProps)(ErrorHandling(QueriesPage))
)
