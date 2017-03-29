import React, {PropTypes} from 'react'
import {withRouter} from 'react-router'
import {connect} from 'react-redux'
import _ from 'lodash'
import * as kapacitorActionCreators from '../actions/view'
import * as queryActionCreators from '../../data_explorer/actions/view'
import {bindActionCreators} from 'redux'
import {getKapacitor, getKapacitorConfig} from 'shared/apis/index'
import {ALERTS, DEFAULT_RULE_ID} from 'src/kapacitor/constants'
import KapacitorRule from 'src/kapacitor/components/KapacitorRule'

export const KapacitorRulePage = React.createClass({
  propTypes: {
    source: PropTypes.shape({
      links: PropTypes.shape({
        proxy: PropTypes.string.isRequired,
        self: PropTypes.string.isRequired,
      }),
    }),
    addFlashMessage: PropTypes.func,
    rules: PropTypes.shape({}).isRequired,
    queryConfigs: PropTypes.shape({}).isRequired,
    kapacitorActions: PropTypes.shape({
      loadDefaultRule: PropTypes.func.isRequired,
      fetchRule: PropTypes.func.isRequired,
      chooseTrigger: PropTypes.func.isRequired,
      updateRuleValues: PropTypes.func.isRequired,
      updateMessage: PropTypes.func.isRequired,
      updateAlerts: PropTypes.func.isRequired,
      updateRuleName: PropTypes.func.isRequired,
    }).isRequired,
    queryActions: PropTypes.shape({}).isRequired,
    params: PropTypes.shape({
      ruleID: PropTypes.string,
    }).isRequired,
    router: PropTypes.shape({
      push: PropTypes.func.isRequired,
    }).isRequired,
  },

  getInitialState() {
    return {
      enabledAlerts: [],
      kapacitor: {},
    }
  },

  componentDidMount() {
    const {params, source, kapacitorActions, addFlashMessage} = this.props
    if (this.isEditing()) {
      kapacitorActions.fetchRule(source, params.ruleID)
    } else {
      kapacitorActions.loadDefaultRule()
    }

    getKapacitor(source).then((kapacitor) => {
      this.setState({kapacitor})
      getKapacitorConfig(kapacitor).then(({data: {sections}}) => {
        const enabledAlerts = Object.keys(sections).filter((section) => {
          return _.get(sections, [section, 'elements', '0', 'options', 'enabled'], false) && ALERTS.includes(section)
        })
        this.setState({enabledAlerts})
      }).catch(() => {
        addFlashMessage({type: 'error', text: `There was a problem communicating with Kapacitor`})
      }).catch(() => {
        addFlashMessage({type: 'error', text: `We couldn't find a configured Kapacitor for this source`})
      })
    })
  },

  render() {
    const {rules, queryConfigs, params, kapacitorActions,
      source, queryActions, addFlashMessage, router} = this.props
    const {enabledAlerts, kapacitor} = this.state

    const rule = this.isEditing() ? rules[params.ruleID] : rules[DEFAULT_RULE_ID]
    const query = rule && queryConfigs[rule.queryID]

    if (!query) {
      return <div className="page-spinner"></div>
    }

    return (
      <KapacitorRule
        source={source}
        rule={rule}
        query={query}
        queryConfigs={queryConfigs}
        queryActions={queryActions}
        kapacitorActions={kapacitorActions}
        addFlashMessage={addFlashMessage}
        enabledAlerts={enabledAlerts}
        isEditing={this.isEditing()}
        router={router}
        kapacitor={kapacitor}
      />
    )
  },

  isEditing() {
    const {params} = this.props
    return params.ruleID && params.ruleID !== 'new'
  },
})

function mapStateToProps(state) {
  return {
    rules: state.rules,
    queryConfigs: state.queryConfigs,
  }
}

function mapDispatchToProps(dispatch) {
  return {
    kapacitorActions: bindActionCreators(kapacitorActionCreators, dispatch),
    queryActions: bindActionCreators(queryActionCreators, dispatch),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(withRouter(KapacitorRulePage))
