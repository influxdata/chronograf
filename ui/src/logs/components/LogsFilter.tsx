import React, {PureComponent, ChangeEvent, KeyboardEvent} from 'react'
import classnames from 'classnames'
import {Filter} from 'src/types/logs'
import {getDeep} from 'src/utils/wrappers'
import {ClickOutside} from 'src/shared/components/ClickOutside'

interface Props {
  filter: Filter
  onDelete: (id: string) => void
  onChangeFilter: (id: string, newOperator: string, newValue: string) => void
}

interface State {
  editing: boolean
  value: string
  operator: string
}

class LogsFilter extends PureComponent<Props, State> {
  constructor(props: Props) {
    super(props)

    this.state = {
      editing: false,
      value: this.props.filter.value,
      operator: this.props.filter.operator,
    }
  }

  public render() {
    const {editing} = this.state

    return (
      <ClickOutside onClickOutside={this.handleClickOutside}>
        <li className={this.className} onClick={this.handleStartEdit}>
          {editing ? this.renderEditor : this.label}
          <div
            className="logs-viewer--filter-remove"
            onClick={this.handleDelete}
          />
        </li>
      </ClickOutside>
    )
  }

  private handleClickOutside = (): void => {
    this.stopEditing()
  }

  private handleStartEdit = (): void => {
    this.setState({editing: true})
  }

  private get className(): string {
    const {editing} = this.state
    return classnames('logs-viewer--filter', {active: editing})
  }

  private handleDelete = () => {
    const id = getDeep(this.props, 'filter.id', '')
    this.props.onDelete(id)
  }

  private get label(): JSX.Element {
    const {
      filter: {key, operator, value},
    } = this.props

    let displayKey = key
    if (key === 'severity_1') {
      displayKey = 'severity'
    }

    return <span>{`${displayKey} ${operator} ${value}`}</span>
  }

  private get renderEditor(): JSX.Element {
    const {operator, value} = this.state
    const {
      filter: {key},
    } = this.props

    return (
      <>
        <div>{key}</div>
        <input
          type="text"
          maxLength={2}
          value={operator}
          className="form-control monotype input-xs logs-viewer--operator"
          spellCheck={false}
          onChange={this.handleOperatorInput}
          onKeyDown={this.handleKeyDown}
        />
        <input
          type="text"
          value={value}
          className="form-control monotype input-xs logs-viewer--value"
          spellCheck={false}
          autoFocus={true}
          onChange={this.handleValueInput}
          onKeyDown={this.handleKeyDown}
        />
      </>
    )
  }

  private handleOperatorInput = (e: ChangeEvent<HTMLInputElement>): void => {
    const operator = getDeep(e, 'target.value', '').trim()

    this.setState({operator})
  }

  private handleValueInput = (e: ChangeEvent<HTMLInputElement>): void => {
    const value = getDeep(e, 'target.value', '').trim()
    this.setState({value})
  }

  private handleKeyDown = (e: KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') {
      e.preventDefault()
      this.stopEditing()
    }
  }

  private stopEditing(): void {
    const id = getDeep(this.props, 'filter.id', '')
    const {operator, value} = this.state

    let state = {}
    if (['!=', '==', '=~'].includes(operator) && value !== '') {
      this.props.onChangeFilter(id, operator, value)
    } else {
      const {filter} = this.props
      state = {operator: filter.operator, value: filter.value}
    }

    this.setState({...state, editing: false})
  }
}

export default LogsFilter
