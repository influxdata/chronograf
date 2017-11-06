import * as React from 'react'
import * as PropTypes from 'prop-types'
import {withRouter} from 'react-router-dom'

import groupByTimeOptions from 'data_explorer/data/groupByTimes'

import Dropdown from 'shared/components/Dropdown'

import {AUTO_GROUP_BY} from 'shared/constants'

const {func, string, shape} = PropTypes

const isInRuleBuilder = pathname => pathname.includes('alert-rules')
const isInDataExplorer = pathname => pathname.includes('data-explorer')

const getOptions = pathname =>
  isInDataExplorer(pathname) || isInRuleBuilder(pathname)
    ? groupByTimeOptions.filter(({menuOption}) => menuOption !== AUTO_GROUP_BY)
    : groupByTimeOptions

const GroupByTimeDropdown = ({
  selected,
  onChooseGroupByTime,
  location: {pathname},
}) =>
  <div className="group-by-time">
    <label className="group-by-time--label">Group by:</label>
    <Dropdown
      className="group-by-time--dropdown"
      menuClass={isInRuleBuilder(pathname) ? 'dropdown-malachite' : null}
      buttonColor={isInRuleBuilder(pathname) ? 'btn-default' : 'btn-info'}
      items={getOptions(pathname).map(groupBy => ({
        ...groupBy,
        text: groupBy.menuOption,
      }))}
      onChoose={onChooseGroupByTime}
      selected={selected || 'Time'}
    />
  </div>

GroupByTimeDropdown.propTypes = {
  location: shape({
    pathname: string.isRequired,
  }).isRequired,
  selected: string,
  onChooseGroupByTime: func.isRequired,
}

export default withRouter(GroupByTimeDropdown)
