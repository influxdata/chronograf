import * as React from 'react'
import {connect} from 'react-redux'
import {bindActionCreators} from 'redux'

import flatten from 'lodash/flatten'
import uniqBy from 'lodash/uniqBy'

import {showDatabases, showQueries} from 'shared/apis/metaQuery'

import QueriesTable from 'admin/components/QueriesTable'
import showDatabasesParser from 'shared/parsing/showDatabases'
import showQueriesParser from 'shared/parsing/showQueries'
import {Source} from 'src/types'
import {func} from 'src/types/funcs'
import {InfluxDBAdminQuery as Query} from 'src/types/influxdbAdmin'

import {
  loadQueries as loadQueriesAction,
  setQueryToKill as setQueryToKillAction,
  killQueryAsync,
} from 'admin/actions'

import {publishAutoDismissingNotification} from 'shared/dispatchers'

export interface QueriesPageProps {
  source: Source
  queries: Query[]
  loadQueries: (queries: Query[]) => void
  queryIDToKill: string
  setQueryToKill: func
  killQuery: (proxy: string, id: string) => void
  notify: (type: string, message: string) => void
}

class QueriesPage extends React.Component<QueriesPageProps> {
  private intervalID

  private updateQueries = () => {
    const {source, notify, loadQueries} = this.props
    showDatabases(source.links.proxy).then(resp => {
      const {databases, errors} = showDatabasesParser(resp.data)
      if (errors.length) {
        errors.forEach(message => notify('error', message))
        return
      }

      const fetches = databases.map(db => showQueries(source.links.proxy, db))

      Promise.all(fetches).then(queryResponses => {
        const allQueries = []
        queryResponses.forEach((queryResponse: {data: {}}) => {
          const result = showQueriesParser(queryResponse.data)
          if (result.errors.length) {
            result.errors.forEach(message => notify('error', message))
          }

          allQueries.push(...result.queries)
        })

        const queries = uniqBy(flatten(allQueries), q => q.id)
        loadQueries(queries)
      })
    })
  }

  private handleKillQuery = id => {
    const {source, killQuery} = this.props
    killQuery(source.links.proxy, id)
  }

  public componentDidMount() {
    this.updateQueries()
    const updateInterval = 5000
    this.intervalID = setInterval(this.updateQueries, updateInterval)
  }

  public componentWillUnmount() {
    clearInterval(this.intervalID)
  }

  public render() {
    const {queries} = this.props

    return <QueriesTable queries={queries} onKillQuery={this.handleKillQuery} />
  }
}

const mapStateToProps = ({admin: {queries, queryIDToKill}}) => ({
  queries,
  queryIDToKill,
})

const mapDispatchToProps = dispatch => ({
  loadQueries: bindActionCreators(loadQueriesAction, dispatch),
  setQueryToKill: bindActionCreators(setQueryToKillAction, dispatch),
  killQuery: bindActionCreators(killQueryAsync, dispatch),
  notify: bindActionCreators(publishAutoDismissingNotification, dispatch),
})

export default connect(mapStateToProps, mapDispatchToProps)(QueriesPage)
