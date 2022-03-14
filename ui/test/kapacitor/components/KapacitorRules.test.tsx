import React from 'react'
import {shallow} from 'enzyme'

import _ from 'lodash'

import KapacitorRules from 'src/kapacitor/components/KapacitorRules'
import KapacitorRulesTable from 'src/kapacitor/components/KapacitorRulesTable'
import TasksTable from 'src/kapacitor/components/TasksTable'

import {source, kapacitorRules, kapacitor} from 'test/resources'

describe('Kapacitor.Containers.KapacitorRules', () => {
  const props = {
    source,
    rules: kapacitorRules,
    kapacitor,
    loading: false,
    onDelete: () => {},
    onChangeRuleStatus: () => {},
  }

  describe('rendering', () => {
    it('renders KapacitorRules', () => {
      const wrapper = shallow(<KapacitorRules {...props} />)

      expect(wrapper.exists()).toBe(true)
    })

    it('renders KapacitorRulesTable without', () => {
      const wrapper = shallow(<KapacitorRules {...props} />)

      const kapacitorRulesTable = wrapper.find(KapacitorRulesTable)
      expect(kapacitorRulesTable.length).toEqual(1)

      const tasksTable = wrapper.find(TasksTable)
      expect(tasksTable.length).toEqual(0)
    })

    describe('rows in KapacitorRulesTable', () => {
      const findRows = (root, reactTable) =>
        root
          .find(reactTable)
          .dive()
          .find('tbody')
          .children()
          .map(child => {
            const ruleID = child.key()
            const elRow = child.dive()
            const elLabel = elRow.find('label')
            const {htmlFor} = elLabel.props()
            const elCheckbox = elRow.find({type: 'checkbox'})
            const {checked, id} = elCheckbox.props()

            return {
              row: {
                el: elRow,
                label: {
                  el: elLabel,
                  htmlFor,
                },
                checkbox: {
                  el: elCheckbox,
                  checked,
                  id,
                },
              },
              rule: {
                id: ruleID, // rule.id
              },
            }
          })

      const containsAnyDuplicate = arr => _.uniq(arr).length !== arr.length

      let wrapper
      let rulesRows

      beforeEach(() => {
        wrapper = shallow(<KapacitorRules {...props} />)
        rulesRows = findRows(wrapper, KapacitorRulesTable)
      })

      it('renders every rule checkbox with unique html id', () => {
        const allCheckboxIDs = rulesRows.map(r => r.row.checkbox.id)

        expect(containsAnyDuplicate(allCheckboxIDs)).toEqual(false)
      })

      it('renders each rule table row label with unique "for" attribute', () => {
        const allCheckboxLabelFors = rulesRows.map(r => r.row.label.htmlFor)

        expect(containsAnyDuplicate(allCheckboxLabelFors)).toEqual(false)
      })
    })
  })
})
