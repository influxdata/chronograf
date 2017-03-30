import reducer from 'src/kapacitor/reducers/rules'
import {defaultRuleConfigs} from 'src/kapacitor/constants'
import {ALERT_NODES_ACCESSORS} from 'src/kapacitor/constants'

import {
  chooseTrigger,
  updateRuleValues,
  updateDetails,
  updateMessage,
  updateAlerts,
  updateAlertNodes,
  updateRuleName,
  deleteRuleSuccess,
  updateRuleStatusSuccess,
} from 'src/kapacitor/actions/view'

describe('Kapacitor.Reducers.rules', () => {
  it('can choose a trigger', () => {
    const ruleID = 1
    const initialState = {
      [ruleID]: {
        id: ruleID,
        queryID: 988,
        trigger: '',
      },
    }

    let newState = reducer(initialState, chooseTrigger(ruleID, 'deadman'))
    expect(newState[ruleID].trigger).to.equal('deadman')
    expect(newState[ruleID].values).to.equal(defaultRuleConfigs.deadman)

    newState = reducer(initialState, chooseTrigger(ruleID, 'relative'))
    expect(newState[ruleID].trigger).to.equal('relative')
    expect(newState[ruleID].values).to.equal(defaultRuleConfigs.relative)

    newState = reducer(initialState, chooseTrigger(ruleID, 'threshold'))
    expect(newState[ruleID].trigger).to.equal('threshold')
    expect(newState[ruleID].values).to.equal(defaultRuleConfigs.threshold)
  })

  it('can update the values', () => {
    const ruleID = 1
    const initialState = {
      [ruleID]: {
        id: ruleID,
        queryID: 988,
        trigger: 'deadman',
        values: defaultRuleConfigs.deadman,
      },
    }

    const newDeadmanValues = {duration: '5m'}
    const newState = reducer(initialState, updateRuleValues(ruleID, 'deadman', newDeadmanValues))
    expect(newState[ruleID].values).to.equal(newDeadmanValues)

    const newRelativeValues = {func: 'max', change: 'change'}
    const finalState = reducer(newState, updateRuleValues(ruleID, 'relative', newRelativeValues))
    expect(finalState[ruleID].trigger).to.equal('relative')
    expect(finalState[ruleID].values).to.equal(newRelativeValues)
  })

  it('can update the message', () => {
    const ruleID = 1
    const initialState = {
      [ruleID]: {
        id: ruleID,
        queryID: 988,
        message: '',
      },
    }

    const message = 'im a kapacitor rule message'
    const newState = reducer(initialState, updateMessage(ruleID, message))
    expect(newState[ruleID].message).to.equal(message)
  })

  it('can update the alerts', () => {
    const ruleID = 1
    const initialState = {
      [ruleID]: {
        id: ruleID,
        queryID: 988,
        alerts: [],
      },
    }

    const alerts = ['slack']
    const newState = reducer(initialState, updateAlerts(ruleID, alerts))
    expect(newState[ruleID].alerts).to.equal(alerts)
  })

  it('can update an alerta alert', () => {
    const ruleID = 1
    const initialState = {
      [ruleID]: {
        id: ruleID,
        queryID: 988,
        alerts: [],
        alertNodes: [],
      },
    }

    const tickScript = `stream
      |alert()
        .alerta()
          .resource('Hostname or service')
          .event('Something went wrong')
          .environment('Development')
          .group('Dev. Servers')
          .services('a b c')
    `

    let newState = reducer(initialState, updateAlertNodes(ruleID, 'alerta', tickScript))
    const expectedStr = `alerta().resource('Hostname or service').event('Something went wrong').environment('Development').group('Dev. Servers').services('a b c')`
    let actualStr = ALERT_NODES_ACCESSORS.alerta(newState[ruleID])

    // Test both data structure and accessor string
    expect(actualStr).to.equal(expectedStr)

    // Test that accessor string is the same if fed back in
    newState = reducer(newState, updateAlertNodes(ruleID, 'alerta', actualStr))
    actualStr = ALERT_NODES_ACCESSORS.alerta(newState[ruleID])
    expect(actualStr).to.equal(expectedStr)
  })

  it('can update the name', () => {
    const ruleID = 1
    const name = 'New name'
    const initialState = {
      [ruleID]: {
        id: ruleID,
        queryID: 988,
        name: 'Random album title',
      },
    }

    const newState = reducer(initialState, updateRuleName(ruleID, name))
    expect(newState[ruleID].name).to.equal(name)
  })

  it('it can delete a rule', () => {
    const rule1 = 1
    const rule2 = 2
    const initialState = {
      [rule1]: {
        id: rule1,
      },
      [rule2]: {
        id: rule2,
      },
    }

    expect(Object.keys(initialState).length).to.equal(2)
    const newState = reducer(initialState, deleteRuleSuccess(rule2))
    expect(Object.keys(newState).length).to.equal(1)
    expect(newState[rule1]).to.equal(initialState[rule1])
  })

  it('can update details', () => {
    const ruleID = 1
    const details = 'im some rule details'

    const initialState = {
      [ruleID]: {
        id: ruleID,
        queryID: 988,
        details: '',
      },
    }

    const newState = reducer(initialState, updateDetails(ruleID, details))
    expect(newState[ruleID].details).to.equal(details)
  })

  it('can update status', () => {
    const ruleID = 1
    const status = 'enabled'

    const initialState = {
      [ruleID]: {
        id: ruleID,
        queryID: 988,
        status: 'disabled',
      },
    }

    const newState = reducer(initialState, updateRuleStatusSuccess(ruleID, status))
    expect(newState[ruleID].status).to.equal(status)
  })
})
