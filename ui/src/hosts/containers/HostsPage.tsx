// Libraries
import React, {PureComponent} from 'react'
import {connect} from 'react-redux'
import {withSource} from 'src/CheckSources'
import {bindActionCreators} from 'redux'
import _ from 'lodash'
import {getDeep} from 'src/utils/wrappers'

// Components
import HostsTable from 'src/hosts/components/HostsTable'
import AutoRefreshDropdown from 'src/shared/components/dropdown_auto_refresh/AutoRefreshDropdown'
import ManualRefresh, {
  ManualRefreshProps,
} from 'src/shared/components/ManualRefresh'
import {Page} from 'src/reusable_ui'
import {ErrorHandling} from 'src/shared/decorators/errors'

// APIs
import {
  getCpuAndLoadForHosts,
  getLayouts,
  getAppsForHosts,
} from 'src/hosts/apis'
import {getEnv} from 'src/shared/apis/env'

// Actions
import {setAutoRefresh} from 'src/shared/actions/app'
import {notify as notifyAction} from 'src/shared/actions/notifications'

// Utils
import {generateForHosts} from 'src/utils/tempVars'

// Constants
import {
  notifyUnableToGetHosts,
  notifyUnableToGetApps,
} from 'src/shared/copy/notifications'

// Types
import {
  Source,
  Links,
  NotificationAction,
  RemoteDataState,
  Host,
  Layout,
  RefreshRate,
} from 'src/types'

interface Props extends ManualRefreshProps {
  source: Source
  links: Links
  autoRefresh: number
  onChooseAutoRefresh: (milliseconds: RefreshRate) => void
  notify: NotificationAction
}

interface State {
  hostsObject: {[x: string]: Host}
  hostsPageStatus: RemoteDataState
  layouts: Layout[]
}

class HostsPageEH extends PureComponent<Props, State> {
  public static defaultProps: Partial<Props> = {
    manualRefresh: 0,
  }
  public intervalID: number

  constructor(props: Props) {
    super(props)

    this.state = {
      hostsObject: {},
      hostsPageStatus: RemoteDataState.NotStarted,
      layouts: [],
    }
    this.handleChooseAutoRefresh = this.handleChooseAutoRefresh.bind(this)
  }

  public async componentDidMount() {
    const {notify, autoRefresh} = this.props

    this.setState({hostsPageStatus: RemoteDataState.Loading})

    const layoutResults = await getLayouts()
    const layouts = getDeep<Layout[]>(layoutResults, 'data.layouts', [])

    if (!layouts) {
      notify(notifyUnableToGetApps())
      this.setState({
        hostsPageStatus: RemoteDataState.Error,
        layouts,
      })
      return
    }
    await this.fetchHostsData(layouts)
    if (autoRefresh) {
      this.intervalID = window.setInterval(
        () => this.fetchHostsData(layouts),
        autoRefresh
      )
    }
    this.setState({layouts})
  }

  public UNSAFE_componentWillReceiveProps(nextProps: Props) {
    const {layouts} = this.state
    if (layouts) {
      if (this.props.manualRefresh !== nextProps.manualRefresh) {
        this.fetchHostsData(layouts)
      }

      if (this.props.autoRefresh !== nextProps.autoRefresh) {
        clearInterval(this.intervalID)

        if (nextProps.autoRefresh) {
          this.intervalID = window.setInterval(
            () => this.fetchHostsData(layouts),
            nextProps.autoRefresh
          )
        }
      }
    }
  }

  public componentWillUnmount() {
    clearInterval(this.intervalID)
    this.intervalID = null
  }

  public handleChooseAutoRefresh(option) {
    const {onChooseAutoRefresh} = this.props
    const {milliseconds} = option
    onChooseAutoRefresh(milliseconds)
  }

  public render() {
    const {source, autoRefresh, onManualRefresh} = this.props
    const {hostsObject, hostsPageStatus} = this.state
    return (
      <Page className="hosts-list-page">
        <Page.Header>
          <Page.Header.Left>
            <Page.Title title="Host List" />
          </Page.Header.Left>
          <Page.Header.Right showSourceIndicator={true}>
            <AutoRefreshDropdown
              selected={autoRefresh}
              onChoose={this.handleChooseAutoRefresh}
              onManualRefresh={onManualRefresh}
            />
          </Page.Header.Right>
        </Page.Header>
        <Page.Contents scrollable={false}>
          <HostsTable
            source={source}
            hosts={_.values(hostsObject)}
            hostsPageStatus={hostsPageStatus}
          />
        </Page.Contents>
      </Page>
    )
  }

  private async fetchHostsData(layouts: Layout[]): Promise<void> {
    const {source, links, notify} = this.props

    const envVars = await getEnv(links.environment)
    const telegrafSystemInterval = getDeep<string>(
      envVars,
      'telegrafSystemInterval',
      ''
    )
    const hostsError = notifyUnableToGetHosts().message
    const tempVars = generateForHosts(source)

    try {
      const hostsObject = await getCpuAndLoadForHosts(
        source.links.proxy,
        source.telegraf,
        telegrafSystemInterval,
        tempVars
      )
      if (!hostsObject) {
        throw new Error(hostsError)
      }
      const newHosts = await getAppsForHosts(
        source.links.proxy,
        hostsObject,
        layouts,
        source.telegraf
      )

      this.setState({
        hostsObject: newHosts,
        hostsPageStatus: RemoteDataState.Done,
      })
    } catch (error) {
      console.error(error)
      notify(notifyUnableToGetHosts())
      this.setState({
        hostsPageStatus: RemoteDataState.Error,
      })
    }
  }
}

export const HostsPage = ErrorHandling(HostsPageEH)

const mstp = state => {
  const {
    app: {
      persisted: {autoRefresh},
    },
    links,
  } = state
  return {
    links,
    autoRefresh,
  }
}

const mdtp = dispatch => ({
  onChooseAutoRefresh: bindActionCreators(setAutoRefresh, dispatch),
  notify: bindActionCreators(notifyAction, dispatch),
})

export default withSource(connect(mstp, mdtp)(ManualRefresh<Props>(HostsPage)))
