import React, {PureComponent, MouseEvent} from 'react'
import _ from 'lodash'

import HandlerOptions from 'src/kapacitor/components/HandlerOptions'
import HandlerTabs from 'src/kapacitor/components/HandlerTabs'
import Dropdown from 'src/reusable_ui/components/dropdowns/Dropdown'
import {DropdownMenuColors} from 'src/reusable_ui/types'

import {parseHandlersFromRule} from 'src/shared/parsing/parseHandlersFromRule'

import {DEFAULT_HANDLERS, AlertTypes} from 'src/kapacitor/constants'
import {ErrorHandling} from 'src/shared/decorators/errors'

import {Handler} from 'src/types/kapacitor'
import {AlertRule} from 'src/types'

interface HandlerWithText extends Handler {
  text: string
}

interface RuleActions {
  updateAlertNodes: (id: string, handlersOnThisAlert: Handler[]) => void
  updateMessage: (id: string, e: MouseEvent<HTMLInputElement>) => void
  updateDetails: () => void
}

interface Props {
  rule: AlertRule
  ruleActions: RuleActions
  handlersFromConfig: Handler[]
  onGoToConfig: (configName: string) => void
  validationError: string
}

interface HandlerKind {
  alerta?: number
  hipchat?: number
  httppost?: number
  influxdb?: number
  kafka?: number
  mqtt?: number
  opsgenie?: number
  opsgenie2?: number
  pagerduty?: number
  pagerduty2?: number
  pushover?: number
  sensu?: number
  slack?: number
  smtp?: number
  snmptrap?: number
  talk?: number
  telegram?: number
  victorops?: number
  post?: number
  tcp?: number
  exec?: number
  log?: number
  separator?: number
}

interface State {
  selectedHandler: Handler
  handlersOnThisAlert: Handler[]
  handlersOfKind: HandlerKind
}

@ErrorHandling
class RuleHandlers extends PureComponent<Props, State> {
  constructor(props) {
    super(props)
    const {handlersFromConfig} = this.props
    const {
      handlersOnThisAlert,
      selectedHandler,
      handlersOfKind,
    } = parseHandlersFromRule(this.props.rule, handlersFromConfig)

    this.state = {
      selectedHandler,
      handlersOnThisAlert,
      handlersOfKind,
    }
  }

  public render() {
    const {
      rule,
      ruleActions,
      onGoToConfig,
      validationError,
      handlersFromConfig,
    } = this.props
    const {handlersOnThisAlert, selectedHandler} = this.state

    const allHandlers: Handler[] = [...DEFAULT_HANDLERS, ...handlersFromConfig]
    const mappedHandlers: HandlerWithText[] = this.mapWithNicknames(allHandlers)

    const mappedHandlersOnThisAlert: HandlerWithText[] = this.mapWithNicknames(
      handlersOnThisAlert
    )

    const separator = {
      type: AlertTypes.separator,
      enabled: true,
      text: 'SEPARATOR',
    }

    const handlers: HandlerWithText[] = [
      ..._.filter<HandlerWithText>(mappedHandlers, e => e.enabled),
      separator,
      ..._.filter<HandlerWithText>(mappedHandlers, ['enabled', false]),
    ]

    const dropdownLabel = handlersOnThisAlert.length
      ? 'Add another Handler'
      : 'Add a Handler'

    const ruleSectionClassName = handlersOnThisAlert.length
      ? 'rule-section--row rule-section--row-first rule-section--border-bottom'
      : 'rule-section--row rule-section--row-first rule-section--row-last'

    const selectedHandlerWithText: HandlerWithText = this.addNicknameText(
      selectedHandler
    )

    return (
      <div className="rule-section">
        <h3 className="rule-section--heading">Alert Handlers</h3>
        <div className="rule-section--body">
          <div className={ruleSectionClassName}>
            <p>Send this Alert to:</p>
            <Dropdown
              width={170}
              customClass="rule-message--add-endpoint"
              selectedItem={dropdownLabel}
              onChange={this.handleAddHandler}
              menuColor={DropdownMenuColors.Malachite}
            >
              {this.dropdownMenuItems(handlers)}
            </Dropdown>
          </div>
          {mappedHandlersOnThisAlert.length ? (
            <div className="rule-message--endpoints">
              <HandlerTabs
                handlersOnThisAlert={mappedHandlersOnThisAlert}
                selectedHandler={selectedHandlerWithText}
                handleChooseHandler={this.handleChooseHandler}
                handleRemoveHandler={this.handleRemoveHandler}
              />
              <HandlerOptions
                selectedHandler={selectedHandler}
                handleModifyHandler={this.handleModifyHandler}
                updateDetails={ruleActions.updateDetails}
                rule={rule}
                onGoToConfig={onGoToConfig}
                validationError={validationError}
              />
            </div>
          ) : null}
        </div>
      </div>
    )
  }

  private dropdownMenuItems = (handlers: HandlerWithText[]): JSX.Element[] => {
    return handlers.map(option => {
      if (option.type === AlertTypes.separator) {
        return (
          <Dropdown.Divider key={`alert-handlers-dropdown-${option.text}`} />
        )
      }

      return (
        <Dropdown.Item
          key={`alert-handlers-dropdown-${option.text}`}
          text={option.text}
          value={option}
        />
      )
    })
  }

  private handleChooseHandler = (ep: HandlerWithText): (() => void) => () => {
    this.setState({selectedHandler: ep})
  }

  private handleAddHandler = (selectedItem: Handler): void => {
    const {handlersOnThisAlert, handlersOfKind} = this.state
    const newItemNumbering: number =
      _.get(handlersOfKind, selectedItem.type, 0) + 1
    const newItemName: string = `${selectedItem.type}-${newItemNumbering}`
    const newEndpoint: Handler = {
      ...selectedItem,
      alias: newItemName,
    }

    // Handle kapacitor requiring a cluster to be provided that matches the id
    if (newEndpoint.type === AlertTypes.kafka) {
      newEndpoint.cluster = newEndpoint.id
    }

    this.setState(
      {
        handlersOnThisAlert: [...handlersOnThisAlert, newEndpoint],
        handlersOfKind: {
          ...handlersOfKind,
          [selectedItem.type]: newItemNumbering,
        },
        selectedHandler: newEndpoint,
      },
      this.handleUpdateAllAlerts
    )
  }

  private handleRemoveHandler = (
    removedHandler: Handler
  ): ((e: MouseEvent<HTMLElement>) => void) => (
    e: MouseEvent<HTMLElement>
  ): void => {
    e.stopPropagation()
    const {handlersOnThisAlert, selectedHandler} = this.state
    const removedIndex: number = _.findIndex(handlersOnThisAlert, [
      'alias',
      removedHandler.alias,
    ])
    const remainingHandlers: Handler[] = _.reject(handlersOnThisAlert, [
      'alias',
      removedHandler.alias,
    ])
    if (selectedHandler.alias === removedHandler.alias) {
      const selectedIndex: number = removedIndex > 0 ? removedIndex - 1 : 0
      const newSelected: Handler = remainingHandlers.length
        ? remainingHandlers[selectedIndex]
        : null
      this.setState({selectedHandler: newSelected})
    }
    this.setState(
      {handlersOnThisAlert: remainingHandlers},
      this.handleUpdateAllAlerts
    )
  }

  private handleUpdateAllAlerts = (): void => {
    const {rule, ruleActions} = this.props
    const {handlersOnThisAlert} = this.state

    ruleActions.updateAlertNodes(rule.id, handlersOnThisAlert)
  }

  private handleModifyHandler = (
    selectedHandler: Handler,
    fieldName: string,
    parseToArray: boolean
  ): ((e) => void) => e => {
    const {handlersOnThisAlert} = this.state
    let modifiedHandler: Handler

    if (e.target.type === 'checkbox') {
      modifiedHandler = {
        ...selectedHandler,
        [fieldName]: !selectedHandler[fieldName],
      }
    } else if (parseToArray) {
      modifiedHandler = {
        ...selectedHandler,
        [fieldName]: _.split(e.target.value, ' '),
      }
    } else {
      modifiedHandler = {
        ...selectedHandler,
        [fieldName]: e.target.value,
      }
    }

    const modifiedIndex: number = _.findIndex(handlersOnThisAlert, [
      'alias',
      modifiedHandler.alias,
    ])

    handlersOnThisAlert[modifiedIndex] = modifiedHandler
    this.setState(
      {
        selectedHandler: modifiedHandler,
        handlersOnThisAlert: [...handlersOnThisAlert],
      },
      this.handleUpdateAllAlerts
    )
  }

  private getNickname = (handler: Handler): string => {
    const configType: AlertTypes = _.get(handler, 'type')
    switch (configType) {
      case AlertTypes.slack:
        return _.get(handler, 'workspace') || 'default'
      case AlertTypes.kafka:
        return _.get(handler, 'id') || _.get(handler, 'cluster')
      default:
        return null
    }
  }

  private addNicknameText = (handler: Handler): HandlerWithText => {
    if (handler) {
      const nickname: string = this.getNickname(handler)
      if (nickname) {
        return {...handler, text: `${handler.type} (${nickname})`}
      }

      return {...handler, text: handler.type}
    }

    return null
  }

  private mapWithNicknames = (handlers: Handler[]): HandlerWithText[] => {
    return _.map(handlers, h => {
      return this.addNicknameText(h)
    })
  }
}

export default RuleHandlers
