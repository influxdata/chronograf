import React, {PropTypes} from 'react';
import ReactTooltip from 'react-tooltip';

import Dropdown from 'shared/components/Dropdown';
import RuleMessageAlertConfig from 'src/kapacitor/components/RuleMessageAlertConfig';

import {
  RULE_MESSAGE_TEMPLATES as templates,
  DEFAULT_ALERTS,
} from '../constants';

const {
  arrayOf,
  func,
  shape,
  string,
} = PropTypes;

export const RuleMessage = React.createClass({
  propTypes: {
    rule: shape({}).isRequired,
    actions: shape({
      updateMessage: func.isRequired,
      updateDetails: func.isRequired,
    }).isRequired,
    enabledAlerts: arrayOf(string.isRequired).isRequired,
  },

  getInitialState() {
    return {
      selectedAlert: null,
      selectedAlertProperty: null,
    };
  },

  handleChangeMessage() {
    const {actions, rule} = this.props;
    actions.updateMessage(rule.id, this.message.value);
  },

  handleChooseAlert(item) {
    const {actions} = this.props;
    actions.updateAlerts(item.ruleID, [item.text]);
    actions.updateAlertNodes(item.ruleID, item.text, '');
    this.setState({selectedAlert: item.text});
  },

  render() {
    const {rule, actions, enabledAlerts} = this.props;
    const defaultAlertEndpoints = DEFAULT_ALERTS.map((text) => {
      return {text, ruleID: rule.id};
    });

    const alerts = enabledAlerts.map((text) => {
      return {text, ruleID: rule.id};
    }).concat(defaultAlertEndpoints);

    const selectedAlert = rule.alerts[0];

    return (
      <div className="kapacitor-rule-section">
        <h3 className="rule-section-heading">Alert Message</h3>
        <div className="rule-section-body">
          <div className="rule-section--item alert-message--endpoint">
            <div>
              <p>Send this Alert to:</p>
              <Dropdown className="dropdown-kapacitor size-136" selected={selectedAlert || 'Choose an output'} items={alerts} onChoose={this.handleChooseAlert} />
            </div>
          </div>
          <RuleMessageAlertConfig
            updateAlertNodes={actions.updateAlertNodes}
            alert={selectedAlert}
            rule={rule}
          />
          {
            selectedAlert === 'smtp' ?
            <div className="alert-message--email-body">
              <textarea
                className="alert-text details"
                placeholder="Subject Line"
                ref={(r) => this.details = r}
                onChange={() => actions.updateDetails(rule.id, this.details.value)}
                value={rule.details}
              />
            </div> : null
          }
          <textarea
            className="alert-text message"
            ref={(r) => this.message = r}
            onChange={() => actions.updateMessage(rule.id, this.message.value)}
            placeholder='Example: {{ .ID }} is {{ .Level }} value: {{ index .Fields "value" }}'
            value={rule.message}
          />
          <div className="alert-message--formatting">
            <p>Templates:</p>
            {
              Object.keys(templates).map(t => {
                return (
                <CodeData
                  key={t}
                  template={templates[t]}
                  onClickTemplate={() => actions.updateMessage(rule.id, `${this.message.value} ${templates[t].label}`)}
                />
                );
              })
            }
            <ReactTooltip effect="solid" html={true} offset={{top: -4}} class="influx-tooltip kapacitor-tooltip" />
          </div>
        </div>
      </div>
    );
  },
});

const CodeData = React.createClass({
  propTypes: {
    onClickTemplate: func,
    template: shape({
      label: string,
      text: string,
    }),
  },

  render() {
    const {onClickTemplate, template} = this.props;
    const {label, text} = template;

    return (
      <code data-tip={text} onClick={onClickTemplate}>{label}</code>
    );
  },
});

export default RuleMessage;
