import React, {PureComponent} from 'react'
import _ from 'lodash'

import SearchBar from 'src/hosts/components/SearchBar'
import HostRow from 'src/hosts/components/HostRow'
import InfiniteScroll from 'src/shared/components/InfiniteScroll'

import {HOSTS_TABLE_SIZING} from 'src/hosts/constants/tableSizing'
import {ErrorHandling} from 'src/shared/decorators/errors'
import {Source, RemoteDataState, Host} from 'src/types'

enum SortDirection {
  ASC = 'asc',
  DESC = 'desc',
}

export interface Props {
  hosts: Host[]
  hostsPageStatus: RemoteDataState
  source: Source
}

interface State {
  searchTerm: string
  sortDirection: SortDirection
  sortKey: string
}

@ErrorHandling
class HostsTable extends PureComponent<Props, State> {
  constructor(props: Props) {
    super(props)

    this.state = {
      searchTerm: '',
      sortDirection: SortDirection.ASC,
      sortKey: null,
    }
  }

  public filter(allHosts: Host[], searchTerm: string): Host[] {
    const filterText = searchTerm.toLowerCase()
    return allHosts.filter(h => {
      const apps = h.apps ? h.apps.join(', ') : ''

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

  public sort(hosts: Host[], key: string, direction: SortDirection): Host[] {
    switch (direction) {
      case SortDirection.ASC:
        return _.sortBy<Host>(hosts, e => e[key])
      case SortDirection.DESC:
        return _.sortBy<Host>(hosts, e => e[key]).reverse()
      default:
        return hosts
    }
  }

  public updateSearchTerm = (term: string): void => {
    this.setState({searchTerm: term})
  }

  public updateSort = (key: string) => (): void => {
    const {sortKey, sortDirection} = this.state
    if (sortKey === key) {
      const reverseDirection =
        sortDirection === SortDirection.ASC
          ? SortDirection.DESC
          : SortDirection.ASC
      this.setState({sortDirection: reverseDirection})
    } else {
      this.setState({sortKey: key, sortDirection: SortDirection.ASC})
    }
  }

  public sortableClasses = (key: string): string => {
    const {sortKey, sortDirection} = this.state
    if (sortKey === key) {
      if (sortDirection === SortDirection.ASC) {
        return 'hosts-table--th sortable-header sorting-ascending'
      }
      return 'hosts-table--th sortable-header sorting-descending'
    }
    return 'hosts-table--th sortable-header'
  }

  public render() {
    return (
      <div className="panel">
        <div className="panel-heading">
          <h2 className="panel-title">{this.HostsTitle}</h2>
          <SearchBar
            placeholder="Filter by Host..."
            onSearch={this.updateSearchTerm}
          />
        </div>
        <div className="panel-body">{this.TableContents}</div>
      </div>
    )
  }

  private get TableContents(): JSX.Element {
    const {hosts, hostsPageStatus} = this.props
    const hostCount = hosts.length
    if (hostsPageStatus === RemoteDataState.Loading) {
      return this.LoadingState
    }
    if (hostsPageStatus === RemoteDataState.Error) {
      return this.ErrorState
    }
    if (hostCount > 0) {
      return this.TableWithHosts
    }
    return this.TableWithNoHosts
  }

  private get LoadingState(): JSX.Element {
    return <div className="page-spinner" />
  }

  private get ErrorState(): JSX.Element {
    return (
      <div className="generic-empty-state">
        <h4 style={{margin: '90px 0'}}>There was a problem loading hosts</h4>
      </div>
    )
  }

  private get TableWithHosts(): JSX.Element {
    const {source, hosts} = this.props
    const {searchTerm, sortKey, sortDirection} = this.state

    const sortedHosts = this.sort(
      this.filter(hosts, searchTerm),
      sortKey,
      sortDirection
    )

    return (
      <div className="hosts-table">
        {this.HostsTableHeader}
        <InfiniteScroll
          items={sortedHosts.map(h => (
            <HostRow key={h.name} host={h} source={source} />
          ))}
          itemHeight={26}
          className="hosts-table--tbody"
        />
      </div>
    )
  }

  private get TableWithNoHosts(): JSX.Element {
    return (
      <div className="generic-empty-state">
        <h4 style={{margin: '90px 0'}}>No Hosts found</h4>
      </div>
    )
  }

  private get HostsTitle(): string {
    const {hostsPageStatus, hosts} = this.props

    if (hostsPageStatus === RemoteDataState.Loading) {
      return 'Loading Hosts...'
    }
    if (hosts.length === 1) {
      return `1 Host`
    }
    return `${hosts.length} Hosts`
  }

  private get HostsTableHeader(): JSX.Element {
    const {colName, colStatus, colCPU, colLoad} = HOSTS_TABLE_SIZING

    return (
      <div className="hosts-table--thead">
        <div className="hosts-table--tr">
          <div
            onClick={this.updateSort('name')}
            className={this.sortableClasses('name')}
            style={{width: colName}}
          >
            Host
            <span className="icon caret-up" />
          </div>
          <div
            onClick={this.updateSort('deltaUptime')}
            className={this.sortableClasses('deltaUptime')}
            style={{width: colStatus}}
          >
            Status
            <span className="icon caret-up" />
          </div>
          <div
            onClick={this.updateSort('cpu')}
            className={this.sortableClasses('cpu')}
            style={{width: colCPU}}
          >
            CPU
            <span className="icon caret-up" />
          </div>
          <div
            onClick={this.updateSort('load')}
            className={this.sortableClasses('load')}
            style={{width: colLoad}}
          >
            Load
            <span className="icon caret-up" />
          </div>
          <div className="hosts-table--th">Apps</div>
        </div>
      </div>
    )
  }
}

export default HostsTable
