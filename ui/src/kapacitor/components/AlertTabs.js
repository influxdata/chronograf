import React, {Component} from 'react'
import PropTypes from 'prop-types'

import _ from 'lodash'

import {Tab, Tabs, TabPanel, TabPanels, TabList} from 'shared/components/Tabs'
import {
  getKapacitorConfig,
  updateKapacitorConfigSection,
  testAlertOutput,
} from 'shared/apis'

import {
  AlertaConfig,
  HipChatConfig,
  OpsGenieConfig,
  PagerDutyConfig,
  PushoverConfig,
  SensuConfig,
  SlackConfig,
  SMTPConfig,
  TalkConfig,
  TelegramConfig,
  VictorOpsConfig,
} from './config'

import {
  NOTIFY_REFRESH_KAPACITOR_FAILED,
  NOTIFY_ALERT_ENDPOINT_SAVED,
  NOTIFY_ALERT_ENDPOINT_SAVE_FAILED,
  NOTIFY_TEST_ALERT_SENT,
  NOTIFY_TEST_ALERT_FAILED,
} from 'shared/copy/notifications'

class AlertTabs extends Component {
  constructor(props) {
    super(props)

    this.state = {
      configSections: null,
    }
  }

  componentDidMount() {
    this.refreshKapacitorConfig(this.props.kapacitor)
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.kapacitor.url !== nextProps.kapacitor.url) {
      this.refreshKapacitorConfig(nextProps.kapacitor)
    }
  }

  refreshKapacitorConfig = async kapacitor => {
    try {
      const {data: {sections}} = await getKapacitorConfig(kapacitor)
      this.setState({configSections: sections})
    } catch (error) {
      this.setState({configSections: null})
      this.props.notify(NOTIFY_REFRESH_KAPACITOR_FAILED)
    }
  }

  getSection = (sections, section) => {
    return _.get(sections, [section, 'elements', '0'], null)
  }

  getEnabled = (sections, section) => {
    return _.get(
      sections,
      [section, 'elements', '0', 'options', 'enabled'],
      null
    )
  }

  handleGetSection = (sections, section) => () => {
    return this.getSection(sections, section)
  }

  handleSaveConfig = section => async properties => {
    if (section !== '') {
      const propsToSend = this.sanitizeProperties(section, properties)
      try {
        await updateKapacitorConfigSection(
          this.props.kapacitor,
          section,
          propsToSend
        )
        this.refreshKapacitorConfig(this.props.kapacitor)
        this.props.notify(NOTIFY_ALERT_ENDPOINT_SAVED(section))
        return true
      } catch ({data: {error}}) {
        const errorMsg = _.join(_.drop(_.split(error, ': '), 2), ': ')
        this.props.notify(NOTIFY_ALERT_ENDPOINT_SAVE_FAILED(section, errorMsg))
        return false
      }
    }
  }

  handleTestConfig = section => async e => {
    e.preventDefault()

    try {
      const {data} = await testAlertOutput(this.props.kapacitor, section)
      if (data.success) {
        this.props.notify(NOTIFY_TEST_ALERT_SENT(section))
      } else {
        this.props.notify(NOTIFY_TEST_ALERT_FAILED(section, data.message))
      }
    } catch (error) {
      this.props.notify(NOTIFY_TEST_ALERT_FAILED(section))
    }
  }

  sanitizeProperties = (section, properties) => {
    const cleanProps = {...properties, enabled: true}
    const {redacted} = this.getSection(this.state.configSections, section)
    if (redacted && redacted.length) {
      redacted.forEach(badProp => {
        if (properties[badProp] === 'true') {
          delete cleanProps[badProp]
        }
      })
    }

    return cleanProps
  }

  getInitialIndex = (supportedConfigs, hash) => {
    const index = _.indexOf(_.keys(supportedConfigs), _.replace(hash, '#', ''))
    return index >= 0 ? index : 0
  }

  render() {
    const {configSections} = this.state
    const {hash} = this.props

    if (!configSections) {
      return null
    }
    const supportedConfigs = {
      alerta: {
        type: 'Alerta',
        enabled: this.getEnabled(configSections, 'alerta'),
        renderComponent: () => (
          <AlertaConfig
            onSave={this.handleSaveConfig('alerta')}
            config={this.getSection(configSections, 'alerta')}
            onTest={this.handleTestConfig('alerta')}
            enabled={this.getEnabled(configSections, 'alerta')}
          />
        ),
      },
      hipchat: {
        type: 'HipChat',
        enabled: this.getEnabled(configSections, 'hipchat'),
        renderComponent: () => (
          <HipChatConfig
            onSave={this.handleSaveConfig('hipchat')}
            config={this.getSection(configSections, 'hipchat')}
            onTest={this.handleTestConfig('hipchat')}
            enabled={this.getEnabled(configSections, 'hipchat')}
          />
        ),
      },
      opsgenie: {
        type: 'OpsGenie',
        enabled: this.getEnabled(configSections, 'opsgenie'),
        renderComponent: () => (
          <OpsGenieConfig
            onSave={this.handleSaveConfig('opsgenie')}
            config={this.getSection(configSections, 'opsgenie')}
            onTest={this.handleTestConfig('opsgenie')}
            enabled={this.getEnabled(configSections, 'opsgenie')}
          />
        ),
      },
      pagerduty: {
        type: 'PagerDuty',
        enabled: this.getEnabled(configSections, 'pagerduty'),
        renderComponent: () => (
          <PagerDutyConfig
            onSave={this.handleSaveConfig('pagerduty')}
            config={this.getSection(configSections, 'pagerduty')}
            onTest={this.handleTestConfig('pagerduty')}
            enabled={this.getEnabled(configSections, 'pagerduty')}
          />
        ),
      },
      pushover: {
        type: 'Pushover',
        enabled: this.getEnabled(configSections, 'pushover'),
        renderComponent: () => (
          <PushoverConfig
            onSave={this.handleSaveConfig('pushover')}
            config={this.getSection(configSections, 'pushover')}
            onTest={this.handleTestConfig('pushover')}
            enabled={this.getEnabled(configSections, 'pushover')}
          />
        ),
      },
      sensu: {
        type: 'Sensu',
        enabled: this.getEnabled(configSections, 'sensu'),
        renderComponent: () => (
          <SensuConfig
            onSave={this.handleSaveConfig('sensu')}
            config={this.getSection(configSections, 'sensu')}
            onTest={this.handleTestConfig('sensu')}
            enabled={this.getEnabled(configSections, 'sensu')}
          />
        ),
      },
      slack: {
        type: 'Slack',
        enabled: this.getEnabled(configSections, 'slack'),
        renderComponent: () => (
          <SlackConfig
            onSave={this.handleSaveConfig('slack')}
            config={this.getSection(configSections, 'slack')}
            onTest={this.handleTestConfig('slack')}
            enabled={this.getEnabled(configSections, 'slack')}
          />
        ),
      },
      smtp: {
        type: 'SMTP',
        enabled: this.getEnabled(configSections, 'smtp'),
        renderComponent: () => (
          <SMTPConfig
            onSave={this.handleSaveConfig('smtp')}
            config={this.getSection(configSections, 'smtp')}
            onTest={this.handleTestConfig('smtp')}
            enabled={this.getEnabled(configSections, 'smtp')}
          />
        ),
      },
      talk: {
        type: 'Talk',
        enabled: this.getEnabled(configSections, 'talk'),
        renderComponent: () => (
          <TalkConfig
            onSave={this.handleSaveConfig('talk')}
            config={this.getSection(configSections, 'talk')}
            onTest={this.handleTestConfig('talk')}
            enabled={this.getEnabled(configSections, 'talk')}
          />
        ),
      },
      telegram: {
        type: 'Telegram',
        enabled: this.getEnabled(configSections, 'telegram'),
        renderComponent: () => (
          <TelegramConfig
            onSave={this.handleSaveConfig('telegram')}
            config={this.getSection(configSections, 'telegram')}
            onTest={this.handleTestConfig('telegram')}
            enabled={this.getEnabled(configSections, 'telegram')}
          />
        ),
      },
      victorops: {
        type: 'VictorOps',
        enabled: this.getEnabled(configSections, 'victorops'),
        renderComponent: () => (
          <VictorOpsConfig
            onSave={this.handleSaveConfig('victorops')}
            config={this.getSection(configSections, 'victorops')}
            onTest={this.handleTestConfig('victorops')}
            enabled={this.getEnabled(configSections, 'victorops')}
          />
        ),
      },
    }
    return (
      <div className="panel">
        <div className="panel-heading">
          <h2 className="panel-title">Configure Alert Endpoints</h2>
        </div>

        <Tabs
          tabContentsClass="config-endpoint"
          initialIndex={this.getInitialIndex(supportedConfigs, hash)}
        >
          <TabList customClass="config-endpoint--tabs">
            {_.reduce(
              configSections,
              (acc, _cur, k) =>
                supportedConfigs[k]
                  ? acc.concat(
                      <Tab
                        key={supportedConfigs[k].type}
                        isConfigured={supportedConfigs[k].enabled}
                      >
                        {supportedConfigs[k].type}
                      </Tab>
                    )
                  : acc,
              []
            )}
          </TabList>
          <TabPanels customClass="config-endpoint--tab-contents">
            {_.reduce(
              configSections,
              (acc, _cur, k) =>
                supportedConfigs[k]
                  ? acc.concat(
                      <TabPanel key={supportedConfigs[k].type}>
                        {supportedConfigs[k].renderComponent()}
                      </TabPanel>
                    )
                  : acc,
              []
            )}
          </TabPanels>
        </Tabs>
      </div>
    )
  }
}

const {func, shape, string} = PropTypes

AlertTabs.propTypes = {
  source: shape({
    id: string.isRequired,
  }).isRequired,
  kapacitor: shape({
    url: string.isRequired,
    links: shape({
      proxy: string.isRequired,
    }).isRequired,
  }),
  notify: func.isRequired,
  hash: string.isRequired,
}

export default AlertTabs
