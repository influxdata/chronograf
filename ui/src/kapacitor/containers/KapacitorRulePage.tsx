import * as React from 'react'
import * as PropTypes from 'prop-types'
import {connect} from 'react-redux'
import * as _ from 'lodash'

import * as kapacitorRuleActionCreators from 'kapacitor/actions/view'
import * as kapacitorQueryConfigActionCreators from 'kapacitor/actions/queryConfigs'

import {bindActionCreators} from 'redux'
import {getActiveKapacitor, getKapacitorConfig} from 'shared/apis/index'
import {RULE_ALERT_OPTIONS, DEFAULT_RULE_ID} from 'kapacitor/constants'
import KapacitorRule from 'kapacitor/components/KapacitorRule'

class KapacitorRulePage extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      enabledAlerts: [],
      kapacitor: {},
    }
  }

  async componentDidMount() {
    const {params, source, ruleActions, addFlashMessage} = this.props
    if (this.isEditing()) {
      ruleActions.fetchRule(source, params.ruleID)
    } else {
      ruleActions.loadDefaultRule()
    }

    const kapacitor = await getActiveKapacitor(this.props.source)
    if (!kapacitor) {
      return addFlashMessage({
        type: 'error',
        text: "We couldn't find a configured Kapacitor for this source", // eslint-disable-line quotes
      })
    }

    try {
      const {data: {sections}} = await getKapacitorConfig(kapacitor)
      const enabledAlerts = Object.keys(sections).filter(
        section =>
          _.get(
            sections,
            [section, 'elements', '0', 'options', 'enabled'],
            false
          ) && _.get(RULE_ALERT_OPTIONS, section, false)
      )

      this.setState({kapacitor, enabledAlerts})
    } catch (error) {
      addFlashMessage({
        type: 'error',
        text: 'There was a problem communicating with Kapacitor',
      })
      console.error(error)
      throw error
    }
  }

  render() {
    const {
      rules,
      queryConfigs,
      params,
      ruleActions,
      source,
      queryConfigActions,
      addFlashMessage,
      router,
    } = this.props
    const {enabledAlerts, kapacitor} = this.state
    const rule = this.isEditing()
      ? rules[params.ruleID]
      : rules[DEFAULT_RULE_ID]
    const query = rule && queryConfigs[rule.queryID]

    if (!query) {
      return <div className="page-spinner" />
    }
    return (
      <KapacitorRule
        source={source}
        rule={rule}
        query={query}
        queryConfigs={queryConfigs}
        queryConfigActions={queryConfigActions}
        ruleActions={ruleActions}
        addFlashMessage={addFlashMessage}
        enabledAlerts={enabledAlerts}
        isEditing={this.isEditing()}
        router={router}
        kapacitor={kapacitor}
      />
    )
  }

  isEditing = () => {
    const {params} = this.props
    return params.ruleID && params.ruleID !== 'new'
  }
}

const {func, shape, string} = PropTypes

KapacitorRulePage.propTypes = {
  source: shape({
    links: shape({
      proxy: string.isRequired,
      self: string.isRequired,
    }),
  }),
  addFlashMessage: func,
  rules: shape({}).isRequired,
  queryConfigs: shape({}).isRequired,
  ruleActions: shape({
    loadDefaultRule: func.isRequired,
    fetchRule: func.isRequired,
    chooseTrigger: func.isRequired,
    addEvery: func.isRequired,
    removeEvery: func.isRequired,
    updateRuleValues: func.isRequired,
    updateMessage: func.isRequired,
    updateAlerts: func.isRequired,
    updateRuleName: func.isRequired,
  }).isRequired,
  queryConfigActions: shape({}).isRequired,
  params: shape({
    ruleID: string,
  }).isRequired,
  router: shape({
    push: func.isRequired,
  }).isRequired,
}

const mapStateToProps = ({rules, kapacitorQueryConfigs: queryConfigs}) => ({
  rules,
  queryConfigs,
})

const mapDispatchToProps = dispatch => ({
  ruleActions: bindActionCreators(kapacitorRuleActionCreators, dispatch),
  queryConfigActions: bindActionCreators(
    kapacitorQueryConfigActionCreators,
    dispatch
  ),
})

export default connect(mapStateToProps, mapDispatchToProps)(KapacitorRulePage)
