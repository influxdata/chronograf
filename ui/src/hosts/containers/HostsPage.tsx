import * as React from 'react'
import * as _ from 'lodash'

import HostsTable from 'hosts/components/HostsTable'
import FancyScrollbar from 'shared/components/FancyScrollbar'
import SourceIndicator from 'shared/components/SourceIndicator'

import {getCpuAndLoadForHosts, getMappings, getAppsForHosts} from '../apis'

import {Host, Source} from 'src/types'
import {addFlashMessage as addFlashMessageType} from 'src/types/funcs'

export interface HostsPageProps {
  source: Source
  addFlashMessage: addFlashMessageType
}

export interface HostsPageState {
  hosts: Host
  hostsLoading: boolean
  hostsError: string
}

export class HostsPage extends React.Component<HostsPageProps, HostsPageState> {
  public state = {
    hosts: {},
    hostsLoading: true,
    hostsError: '',
  }

  public componentDidMount() {
    const {source, addFlashMessage} = this.props
    Promise.all([
      getCpuAndLoadForHosts(source.links.proxy, source.telegraf),
      getMappings(),
      new Promise(resolve => {
        this.setState({hostsLoading: true})
        resolve()
      }),
    ])
      .then(([hosts, {data: {mappings}}]) => {
        this.setState({
          hosts,
          hostsLoading: false,
        })
        getAppsForHosts(source.links.proxy, hosts, mappings, source.telegraf)
          .then(newHosts => {
            this.setState({
              hosts: newHosts,
              hostsError: '',
              hostsLoading: false,
            })
          })
          .catch(error => {
            console.error(error)
            const reason = 'Unable to get apps for hosts'
            addFlashMessage({type: 'error', text: reason})
            this.setState({
              hostsError: reason,
              hostsLoading: false,
            })
          })
      })
      .catch(reason => {
        this.setState({
          hostsError: reason.toString(),
          hostsLoading: false,
        })
        // TODO: this isn't reachable at the moment, because getCpuAndLoadForHosts doesn't fail when it should.
        // (like with a bogus proxy link). We should provide better messaging to the user in this catch after that's fixed.
        console.error(reason) // eslint-disable-line no-console
      })
  }

  public render() {
    const {source} = this.props
    const {hosts, hostsLoading, hostsError} = this.state
    return (
      <div className="page">
        <div className="page-header">
          <div className="page-header__container">
            <div className="page-header__left">
              <h1 className="page-header__title">Host List</h1>
            </div>
            <div className="page-header__right">
              <SourceIndicator source={source} />
            </div>
          </div>
        </div>
        <FancyScrollbar className="page-contents">
          <div className="container-fluid">
            <div className="row">
              <div className="col-md-12">
                <HostsTable
                  source={source}
                  hosts={_.values(hosts)}
                  hostsLoading={hostsLoading}
                  hostsError={hostsError}
                />
              </div>
            </div>
          </div>
        </FancyScrollbar>
      </div>
    )
  }
}

export default HostsPage
