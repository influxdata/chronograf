import React, {PureComponent} from 'react'
import classnames from 'classnames'
import {ErrorHandling} from 'src/shared/decorators/errors'
import {QueryConfig} from 'src/types/queries'

interface Props {
  isActive: boolean
  isVisible: boolean
  query: QueryConfig
  onSelect: (index: number) => void
  onToggleVisbility: (index: number) => void
  onDelete: (index: number) => void
  queryTabText: string
  queryIndex: number
}

@ErrorHandling
class QueryMakerTab extends PureComponent<Props> {
  public static defaultProps: Partial<Props> = {
    isVisible: true,
  }

  public render() {
    return (
      <div className={this.className} onClick={this.handleSelect}>
        {this.visibilityIndicator}
        {this.tabLabel}
        <span
          className="query-maker--delete"
          onClick={this.handleDelete}
          data-test="query-maker-delete"
          title="Delete this query"
        />
      </div>
    )
  }

  private get className(): string {
    const {isActive, isVisible} = this.props

    return classnames('query-maker--tab', {
      active: isActive,
      hidden: !isVisible,
    })
  }

  private get visibilityIndicator(): JSX.Element {
    const {isVisible} = this.props

    if (isVisible) {
      return (
        <span
          className="query-maker--visibility icon eye-open"
          title="Hide this Query"
          onClick={this.handleToggleVisibility}
        />
      )
    }

    return (
      <span
        className="query-maker--visibility icon eye-closed"
        title="Show this Query"
        onClick={this.handleToggleVisibility}
      />
    )
  }

  private get tabLabel(): JSX.Element {
    return (
      <div className="query-maker--tab-label" title={this.props.queryTabText}>
        {this.props.queryTabText}
      </div>
    )
  }

  private handleToggleVisibility = (): void => {
    this.props.onToggleVisbility(this.props.queryIndex)
  }

  private handleSelect = (): void => {
    this.props.onSelect(this.props.queryIndex)
  }

  private handleDelete = (e): void => {
    e.stopPropagation()
    this.props.onDelete(this.props.queryIndex)
  }
}

export default QueryMakerTab
