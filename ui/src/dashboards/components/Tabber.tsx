import * as React from 'react'
import QuestionMarkTooltip from 'shared/components/QuestionMarkTooltip'

export interface TabberProps {
  labelText: string
  tipID?: string
  tipContent?: string
}

export const Tabber: React.SFC<TabberProps> = ({
  labelText,
  children,
  tipID,
  tipContent,
}) => (
  <div className="form-group col-sm-6">
    <label>
      {labelText}
      {tipID ? (
        <QuestionMarkTooltip tipID={tipID} tipContent={tipContent} />
      ) : null}
    </label>
    <ul className="nav nav-tablist nav-tablist-sm">{children}</ul>
  </div>
)

export interface TabProps {
  onClickTab: () => void
  isActive: boolean
  text: string
}

export const Tab: React.SFC<TabProps> = ({isActive, onClickTab, text}) => (
  <li className={isActive ? 'active' : ''} onClick={onClickTab}>
    {text}
  </li>
)
