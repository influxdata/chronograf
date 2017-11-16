import * as React from 'react'
import * as classnames from 'classnames'

export interface TabProps {
  onClick?: () => void
  isDisabled?: boolean
  isActive?: boolean
  isKapacitorTab?: boolean
}

const log = x => {
  console.log(x)
}

export const Tab: React.SFC<TabProps> = ({
  isKapacitorTab,
  isActive,
  isDisabled,
  onClick,
  children,
}) =>
  isKapacitorTab ? (
    <li
      className={classnames({active: isActive})}
      onClick={isDisabled ? null : onClick}
    >
      {children}
    </li>
  ) : (
    <div
      className={classnames('btn tab', {active: isActive})}
      onClick={isDisabled ? null : onClick}
    >
      {children}
    </div>
  )

export interface TabListProps {
  activeIndex?: number
  onActivate?: (index: number) => void
  isKapacitorTabs?: string
  customClass?: string
}

export const TabList: React.SFC<TabListProps> = ({
  activeIndex,
  onActivate,
  customClass,
  isKapacitorTabs = '',
  children,
}) => {
  const withTabList = (Child, index) =>
    React.cloneElement(Child, {
      isActive: index === activeIndex,
      onClick: () => onActivate(index),
    })

  const c = React.Children.map(children, withTabList)

  if (isKapacitorTabs === 'true') {
    return (
      <div className="rule-section--row rule-section--row-first rule-section--row-last">
        <p>Choose One:</p>
        <div className="nav nav-tablist nav-tablist-sm nav-tablist-malachite">
          {c}
        </div>
      </div>
    )
  }

  if (customClass) {
    return (
      <div className={customClass}>
        <div className="btn-group btn-group-lg tab-group">{c}</div>
      </div>
    )
  }

  return <div className="btn-group btn-group-lg tab-group">{c}</div>
}

TabList.displayName = 'TabList'

export interface TabPanelsProps {
  activeIndex?: number
  customClass?: string
}

export const TabPanels: React.SFC<TabPanelsProps> = ({
  customClass,
  activeIndex,
  children,
}) => (
  <div className={customClass ? customClass : null}>
    {children[activeIndex]}
  </div>
)

TabPanels.displayName = 'TabPanels'

export const TabPanel: React.SFC<{}> = ({children}) => <div>{children}</div>

export interface TabsProps {
  onSelect?: (index: number) => void
  tabContentsClass?: string
  tabsClass?: string
  initialIndex?: number
  className?: string
}

export interface TabsState {
  activeIndex: number
}

export class Tabs extends React.Component<TabsProps, TabsState> {
  public static defaultProps = {
    tabContentsClass: '',
  }

  public state = {
    activeIndex: this.props.initialIndex || 0,
  }

  private handleActivateTab = activeIndex => {
    this.setState({activeIndex})
    if (this.props.onSelect) {
      this.props.onSelect(activeIndex)
    }
  }

  public render() {
    const withTabs = Child => {
      if (Child && Child.type.displayName === 'TabPanels') {
        return React.cloneElement(Child, {
          activeIndex: this.state.activeIndex,
        })
      }

      if (Child && Child.type.displayName === 'TabList') {
        return React.cloneElement(Child, {
          activeIndex: this.state.activeIndex,
          onActivate: this.handleActivateTab,
        })
      }
    }

    const children = React.Children.map(this.props.children, withTabs)

    return <div className={this.props.tabContentsClass}>{children}</div>
  }
}
