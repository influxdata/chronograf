import * as React from 'react'
import * as PropTypes from 'prop-types'
import classnames from 'classnames'
import * as _ from 'lodash'

import {showDatabases, showRetentionPolicies} from 'shared/apis/metaQuery'
import showDatabasesParser from 'shared/parsing/showDatabases'
import showRetentionPoliciesParser from 'shared/parsing/showRetentionPolicies'

import FancyScrollbar from 'shared/components/FancyScrollbar'

const {func, shape, string} = PropTypes

class DatabaseList extends React.Component {
  propTypes = {
    query: shape({}).isRequired,
    onChooseNamespace: func.isRequired,
    querySource: shape({
      links: shape({
        proxy: string.isRequired,
      }).isRequired,
    }),
  }

  contextTypes = {
    source: shape({
      links: shape({
        proxy: string.isRequired,
      }).isRequired,
    }).isRequired,
  }

  state = {
    namespaces: [],
  }

  componentDidMount() {
    this.getDbRp()
  }

  componentDidUpdate(prevProps) {
    if (_.isEqual(prevProps.querySource, this.props.querySource)) {
      return
    }

    this.getDbRp()
  }

  getDbRp = () => {
    const {source} = this.context
    const {querySource} = this.props
    const proxy =
      _.get(querySource, ['links', 'proxy'], null) || source.links.proxy

    showDatabases(proxy).then(resp => {
      const {errors, databases} = showDatabasesParser(resp.data)
      if (errors.length) {
        // do something
      }

      const namespaces = []
      showRetentionPolicies(proxy, databases).then(res => {
        res.data.results.forEach((result, index) => {
          const {errors: errs, retentionPolicies} = showRetentionPoliciesParser(
            result
          )
          if (errs.length) {
            // do something
          }

          retentionPolicies.forEach(rp => {
            namespaces.push({
              database: databases[index],
              retentionPolicy: rp.name,
            })
          })
        })

        this.setState({namespaces})
      })
    })
  }

  render() {
    const {query, onChooseNamespace} = this.props
    const {namespaces} = this.state
    const sortedNamespaces = namespaces.length
      ? _.sortBy(namespaces, n => n.database.toLowerCase())
      : namespaces

    return (
      <div className="query-builder--column query-builder--column-db">
        <div className="query-builder--heading">DB.RetentionPolicy</div>
        <div className="query-builder--list">
          <FancyScrollbar>
            {sortedNamespaces.map(namespace => {
              const {database, retentionPolicy} = namespace
              const isActive =
                database === query.database &&
                retentionPolicy === query.retentionPolicy

              return (
                <div
                  className={classnames('query-builder--list-item', {
                    active: isActive,
                  })}
                  key={`${database}..${retentionPolicy}`}
                  onClick={_.wrap(namespace, onChooseNamespace)}
                  data-test={`query-builder-list-item-database-${database}`}
                >
                  {database}.{retentionPolicy}
                </div>
              )
            })}
          </FancyScrollbar>
        </div>
      </div>
    )
  }
}

export default DatabaseList
