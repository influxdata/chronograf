import * as React from 'react'
import * as PropTypes from 'prop-types'

import * as _ from 'lodash'

import Deadman from 'kapacitor/components/Deadman'
import Threshold from 'kapacitor/components/Threshold'
import Relative from 'kapacitor/components/Relative'
import DataSection from 'kapacitor/components/DataSection'
import RuleGraph from 'kapacitor/components/RuleGraph'

import {Tab, TabList, TabPanels, TabPanel, Tabs} from 'shared/components/Tabs'

const TABS = ['Threshold', 'Relative', 'Deadman']

const handleChooseTrigger = (rule, onChooseTrigger) => triggerIndex => {
  if (TABS[triggerIndex] === rule.trigger) {
    return
  }
  return onChooseTrigger(rule.id, TABS[triggerIndex])
}
const initialIndex = rule => TABS.indexOf(_.startCase(rule.trigger))
const isDeadman = rule => rule.trigger === 'deadman'

const ValuesSection = ({
  rule,
  query,
  source,
  timeRange,
  onAddEvery,
  onRemoveEvery,
  onChooseTrigger,
  onDeadmanChange,
  onChooseTimeRange,
  queryConfigActions,
  onRuleTypeInputChange,
  onRuleTypeDropdownChange,
}) =>
  <div className="rule-section">
    <h3 className="rule-section--heading">Alert Type</h3>
    <div className="rule-section--body">
      <Tabs
        initialIndex={initialIndex(rule)}
        onSelect={handleChooseTrigger(rule, onChooseTrigger)}
      >
        <TabList isKapacitorTabs="true">
          {TABS.map(tab =>
            <Tab key={tab} isKapacitorTab={true}>
              {tab}
            </Tab>
          )}
        </TabList>
        <div>
          <h3 className="rule-section--sub-heading">Time Series</h3>
          <DataSection
            query={query}
            timeRange={timeRange}
            isKapacitorRule={true}
            actions={queryConfigActions}
            onAddEvery={onAddEvery}
            onRemoveEvery={onRemoveEvery}
            isDeadman={isDeadman(rule)}
          />
        </div>
        <h3 className="rule-section--sub-heading">Conditions</h3>
        <TabPanels>
          <TabPanel>
            <Threshold
              rule={rule}
              query={query}
              onDropdownChange={onRuleTypeDropdownChange}
              onRuleTypeInputChange={onRuleTypeInputChange}
            />
          </TabPanel>
          <TabPanel>
            <Relative
              rule={rule}
              onDropdownChange={onRuleTypeDropdownChange}
              onRuleTypeInputChange={onRuleTypeInputChange}
            />
          </TabPanel>
          <TabPanel>
            <Deadman rule={rule} onChange={onDeadmanChange} />
          </TabPanel>
        </TabPanels>
        {isDeadman(rule)
          ? null
          : <RuleGraph
              rule={rule}
              query={query}
              source={source}
              timeRange={timeRange}
              onChooseTimeRange={onChooseTimeRange}
            />}
      </Tabs>
    </div>
  </div>

const {shape, string, func} = PropTypes

ValuesSection.propTypes = {
  rule: shape({
    id: string,
  }).isRequired,
  onChooseTrigger: func.isRequired,
  onUpdateValues: func.isRequired,
  query: shape({}).isRequired,
  onDeadmanChange: func.isRequired,
  onRuleTypeDropdownChange: func.isRequired,
  onRuleTypeInputChange: func.isRequired,
  onAddEvery: func.isRequired,
  onRemoveEvery: func.isRequired,
  timeRange: shape({}).isRequired,
  queryConfigActions: shape({}).isRequired,
  source: shape({}).isRequired,
  onChooseTimeRange: func.isRequired,
}

export default ValuesSection
