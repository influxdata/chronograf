import * as React from 'react'
import * as PropTypes from 'prop-types'
import QuestionMarkTooltip from 'shared/components/QuestionMarkTooltip'

export const Tabber = ({labelText, children, tipID, tipContent}) =>
  <div className="form-group col-sm-6">
    <label>
      {labelText}
      {tipID
        ? <QuestionMarkTooltip tipID={tipID} tipContent={tipContent} />
        : null}
    </label>
    <ul className="nav nav-tablist nav-tablist-sm">
      {children}
    </ul>
  </div>

export const Tab = ({isActive, onClickTab, text}) =>
  <li className={isActive ? 'active' : ''} onClick={onClickTab}>
    {text}
  </li>

const {bool, func, node, string} = PropTypes

Tabber.propTypes = {
  children: node.isRequired,
  labelText: string,
  tipID: string,
  tipContent: string,
}

Tab.propTypes = {
  onClickTab: func.isRequired,
  isActive: bool.isRequired,
  text: string.isRequired,
}
