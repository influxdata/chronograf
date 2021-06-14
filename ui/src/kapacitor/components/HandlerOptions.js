import React, {Component} from 'react'
import PropTypes from 'prop-types'
import {
  PostHandler,
  TcpHandler,
  ExecHandler,
  LogHandler,
  EmailHandler,
  AlertaHandler,
  KafkaHandler,
  OpsgenieHandler,
  PagerdutyHandler,
  Pagerduty2Handler,
  PushoverHandler,
  SensuHandler,
  SlackHandler,
  TalkHandler,
  TelegramHandler,
  VictoropsHandler,
  ServiceNowHandler,
  BigPandaHandler,
  TeamsHandler,
  ZenossHandler,
} from 'src/kapacitor/components/handlers'
import {ErrorHandling} from 'src/shared/decorators/errors'

class HandlerOptions extends Component {
  constructor(props) {
    super(props)
  }

  render() {
    const {
      selectedHandler,
      handleModifyHandler,
      rule,
      updateDetails,
      onGoToConfig,
      onTestHandler,
      validationError,
    } = this.props
    switch (selectedHandler && selectedHandler.type) {
      case 'post':
        return (
          <PostHandler
            selectedHandler={selectedHandler}
            handleModifyHandler={handleModifyHandler}
          />
        )
      case 'tcp':
        return (
          <TcpHandler
            selectedHandler={selectedHandler}
            handleModifyHandler={handleModifyHandler}
          />
        )
      case 'exec':
        return (
          <ExecHandler
            selectedHandler={selectedHandler}
            handleModifyHandler={handleModifyHandler}
          />
        )
      case 'log':
        return (
          <LogHandler
            selectedHandler={selectedHandler}
            handleModifyHandler={handleModifyHandler}
          />
        )
      case 'email':
        return (
          <EmailHandler
            selectedHandler={selectedHandler}
            handleModifyHandler={handleModifyHandler}
            onGoToConfig={onGoToConfig('smtp')}
            onTest={onTestHandler('smtp')}
            validationError={validationError}
            updateDetails={updateDetails}
            rule={rule}
          />
        )
      case 'alerta':
        return (
          <AlertaHandler
            selectedHandler={selectedHandler}
            handleModifyHandler={handleModifyHandler}
            onGoToConfig={onGoToConfig('alerta')}
            onTest={onTestHandler('alerta')}
            validationError={validationError}
          />
        )
      case 'kafka':
        return (
          <KafkaHandler
            selectedHandler={selectedHandler}
            handleModifyHandler={handleModifyHandler}
            onGoToConfig={onGoToConfig('kafka')}
            onTest={onTestHandler('kafka')}
            validationError={validationError}
          />
        )
      case 'opsGenie':
        return (
          <OpsgenieHandler
            selectedHandler={selectedHandler}
            handleModifyHandler={handleModifyHandler}
            onGoToConfig={onGoToConfig('opsgenie')}
            onTest={onTestHandler('opsgenie')}
            validationError={validationError}
          />
        )
      case 'opsGenie2':
        return (
          <OpsgenieHandler
            selectedHandler={selectedHandler}
            handleModifyHandler={handleModifyHandler}
            onGoToConfig={onGoToConfig('opsgenie2')}
            onTest={onTestHandler('opsgenie2')}
            validationError={validationError}
          />
        )
      case 'pagerDuty':
        return (
          <PagerdutyHandler
            selectedHandler={selectedHandler}
            handleModifyHandler={handleModifyHandler}
            onGoToConfig={onGoToConfig('pagerduty')}
            onTest={onTestHandler('pagerduty')}
            validationError={validationError}
          />
        )
      case 'pagerDuty2':
        return (
          <Pagerduty2Handler
            selectedHandler={selectedHandler}
            handleModifyHandler={handleModifyHandler}
            onGoToConfig={onGoToConfig('pagerduty2')}
            onTest={onTestHandler('pagerduty2')}
            validationError={validationError}
          />
        )
      case 'pushover':
        return (
          <PushoverHandler
            selectedHandler={selectedHandler}
            handleModifyHandler={handleModifyHandler}
            onGoToConfig={onGoToConfig('pushover')}
            onTest={onTestHandler('pushover')}
            validationError={validationError}
          />
        )
      case 'sensu':
        return (
          <SensuHandler
            selectedHandler={selectedHandler}
            handleModifyHandler={handleModifyHandler}
            onGoToConfig={onGoToConfig('sensu')}
            onTest={onTestHandler('sensu')}
            validationError={validationError}
          />
        )
      case 'slack':
        return (
          <SlackHandler
            selectedHandler={selectedHandler}
            handleModifyHandler={handleModifyHandler}
            onGoToConfig={onGoToConfig('slack')}
            onTest={onTestHandler('slack')}
            validationError={validationError}
          />
        )
      case 'talk':
        return (
          <TalkHandler
            selectedHandler={selectedHandler}
            handleModifyHandler={handleModifyHandler}
            onGoToConfig={onGoToConfig('talk')}
            onTest={onTestHandler('talk')}
            validationError={validationError}
          />
        )
      case 'telegram':
        return (
          <TelegramHandler
            selectedHandler={selectedHandler}
            handleModifyHandler={handleModifyHandler}
            onGoToConfig={onGoToConfig('telegram')}
            onTest={onTestHandler('telegram')}
            validationError={validationError}
          />
        )
      case 'victorOps':
        return (
          <VictoropsHandler
            selectedHandler={selectedHandler}
            handleModifyHandler={handleModifyHandler}
            onGoToConfig={onGoToConfig('victorops')}
            onTest={onTestHandler('victorops')}
            validationError={validationError}
          />
        )
      case 'serviceNow':
        return (
          <ServiceNowHandler
            selectedHandler={selectedHandler}
            handleModifyHandler={handleModifyHandler}
            onGoToConfig={onGoToConfig('servicenow')}
            onTest={onTestHandler('servicenow')}
            validationError={validationError}
          />
        )
      case 'bigPanda':
        return (
          <BigPandaHandler
            selectedHandler={selectedHandler}
            handleModifyHandler={handleModifyHandler}
            onGoToConfig={onGoToConfig('bigpanda')}
            onTest={onTestHandler('bigpanda')}
            validationError={validationError}
          />
        )
      case 'teams':
        return (
          <TeamsHandler
            selectedHandler={selectedHandler}
            handleModifyHandler={handleModifyHandler}
            onGoToConfig={onGoToConfig('teams')}
            onTest={onTestHandler('teams')}
            validationError={validationError}
          />
        )
      case 'zenoss':
        return (
          <ZenossHandler
            selectedHandler={selectedHandler}
            handleModifyHandler={handleModifyHandler}
            onGoToConfig={onGoToConfig('zenoss')}
            onTest={onTestHandler('zenoss')}
            validationError={validationError}
          />
        )
      default:
        return null
    }
  }
}

const {func, shape, string} = PropTypes

HandlerOptions.propTypes = {
  selectedHandler: shape({}).isRequired,
  handleModifyHandler: func.isRequired,
  updateDetails: func,
  rule: shape({}),
  onGoToConfig: func.isRequired,
  onTestHandler: func.isRequired,
  validationError: string.isRequired,
}

export default ErrorHandling(HandlerOptions)
