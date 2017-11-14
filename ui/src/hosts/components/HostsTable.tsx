import * as React from 'react'
import * as _ from 'lodash'

import SearchBar from 'hosts/components/SearchBar'
import HostRow from 'hosts/components/HostRow'
import {HOSTS_TABLE} from 'hosts/constants/tableSizing'

import {Host, SortDirection, Source} from 'src/types'

export interface HostsTableProps {
  hosts: Host[]
  hostsLoading: boolean
  hostsError: string
  source: Source
}

export interface HostsTableState {
  searchTerm: string
  sortDirection: SortDirection
  sortKey: string
}

class HostsTable extends React.Component<HostsTableProps, HostsTableState> {
  public state = {
    searchTerm: '',
    sortDirection: null,
    sortKey: null,
  }

  private filter(allHosts: Host[], searchTerm: string) {
    const filterText = searchTerm.toLowerCase()
    return allHosts.filter(h => {
      const apps = h.apps ? h.apps.join(', ') : ''
      // search each tag for the presence of the search term
      let tagResult = false
      if (h.tags) {
        tagResult = Object.keys(h.tags).reduce((acc, key) => {
          return acc || h.tags[key].toLowerCase().includes(filterText)
        }, false)
      } else {
        tagResult = false
      }
      return (
        h.name.toLowerCase().includes(filterText) ||
        apps.toLowerCase().includes(filterText) ||
        tagResult
      )
    })
  }

  private sort(hosts: Host[], key: string, direction: SortDirection) {
    switch (direction) {
      case SortDirection.asc:
        return _.sortBy(hosts, e => e[key])
      case SortDirection.desc:
        return _.sortBy(hosts, e => e[key]).reverse()
      default:
        return hosts
    }
  }

  private updateSearchTerm = term => {
    this.setState({searchTerm: term})
  }

  private updateSort = key => () => {
    // if we're using the key, reverse order; otherwise, set it with ascending
    if (this.state.sortKey === key) {
      const reverseDirection =
        this.state.sortDirection === SortDirection.asc
          ? SortDirection.desc
          : SortDirection.asc
      this.setState({sortDirection: reverseDirection})
    } else {
      this.setState({sortKey: key, sortDirection: SortDirection.asc})
    }
  }

  private sortableClasses = key => {
    if (this.state.sortKey === key) {
      if (this.state.sortDirection === SortDirection.asc) {
        return 'sortable-header sorting-ascending'
      }
      return 'sortable-header sorting-descending'
    }
    return 'sortable-header'
  }

  public render() {
    const {searchTerm, sortKey, sortDirection} = this.state
    const {hosts, hostsLoading, hostsError, source} = this.props
    const sortedHosts = this.sort(
      this.filter(hosts, searchTerm),
      sortKey,
      sortDirection
    )
    const hostCount = sortedHosts.length
    const {colName, colStatus, colCPU, colLoad} = HOSTS_TABLE

    let hostsTitle

    if (hostsLoading) {
      hostsTitle = 'Loading Hosts...'
    } else if (hostsError.length) {
      hostsTitle = 'There was a problem loading hosts'
    } else if (hostCount === 1) {
      hostsTitle = `${hostCount} Host`
    } else {
      hostsTitle = `${hostCount} Hosts`
    }

    return (
      <div className="panel panel-minimal">
        <div className="panel-heading u-flex u-ai-center u-jc-space-between">
          <h2 className="panel-title">{hostsTitle}</h2>
          <SearchBar onSearch={this.updateSearchTerm} />
        </div>
        <div className="panel-body">
          {hostCount > 0 && !hostsError.length ? (
            <table className="table v-center table-highlight">
              <thead>
                <tr>
                  <th
                    onClick={this.updateSort('name')}
                    className={this.sortableClasses('name')}
                    style={{width: colName}}
                  >
                    Host
                  </th>
                  <th
                    onClick={this.updateSort('deltaUptime')}
                    className={this.sortableClasses('deltaUptime')}
                    style={{width: colStatus}}
                  >
                    Status
                  </th>
                  <th
                    onClick={this.updateSort('cpu')}
                    className={this.sortableClasses('cpu')}
                    style={{width: colCPU}}
                  >
                    CPU
                  </th>
                  <th
                    onClick={this.updateSort('load')}
                    className={this.sortableClasses('load')}
                    style={{width: colLoad}}
                  >
                    Load
                  </th>
                  <th>Apps</th>
                </tr>
              </thead>

              <tbody>
                {sortedHosts.map(h => (
                  <HostRow key={h.name} host={h} source={source} />
                ))}
              </tbody>
            </table>
          ) : (
            <div className="generic-empty-state">
              <h4 style={{margin: '90px 0'}}>No Hosts found</h4>
            </div>
          )}
        </div>
      </div>
    )
  }
}

export default HostsTable
