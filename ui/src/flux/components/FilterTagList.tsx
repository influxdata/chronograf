import React, {PureComponent, MouseEvent} from 'react'
import _ from 'lodash'

import {SchemaFilter, Service} from 'src/types'
import {OnChangeArg, Func} from 'src/types/flux'
import FilterTagListItem from 'src/flux/components/FilterTagListItem'

interface TagCondition {
  tagKey: string
  tagValue: string
}

interface Props {
  db: string
  service: Service
  tags: string[]
  filter: SchemaFilter[]
  onChangeArg: OnChangeArg
  func: Func
  bodyID: string
  declarationID: string
}

interface State {
  conditions: TagCondition[]
}

export default class FilterTagList extends PureComponent<Props, State> {
  constructor(props) {
    super(props)
    this.state = {
      conditions: [],
    }
  }

  public addCondition(condition: TagCondition): TagCondition[] {
    const conditions = [...this.state.conditions, condition]
    this.setState({conditions})
    return conditions
  }

  public removeCondition(condition: TagCondition): TagCondition[] {
    const conditions = _.without(this.state.conditions, condition)
    this.setState({conditions})
    return conditions
  }

  public buildFilterString(conditions: TagCondition[]): string {
    const conditionString = conditions
      .map(c => `r.${c.tagKey} == "${c.tagValue}"`)
      .join(' AND ')
    return `(r) => ${conditionString}`
  }

  public changeValue = (
    tagKey: string,
    tagValue: string,
    selected: boolean
  ): void => {
    const condition: TagCondition = {tagKey, tagValue}
    const conditions: TagCondition[] = selected
      ? this.addCondition(condition)
      : this.removeCondition(condition)
    const filterString: string = this.buildFilterString(conditions)
    this.propagateChange(filterString)
  }

  public propagateChange = (newFilterString: string): void => {
    const {
      func: {id},
      bodyID,
      declarationID,
    } = this.props

    this.props.onChangeArg({
      funcID: id,
      key: 'fn',
      value: newFilterString,
      declarationID,
      bodyID,
      generate: true,
    })
  }

  public render() {
    const {db, service, tags, filter} = this.props

    if (tags.length) {
      return (
        <>
          {tags.map(t => (
            <FilterTagListItem
              key={t}
              db={db}
              tagKey={t}
              changeValue={this.changeValue}
              service={service}
              filter={filter}
            />
          ))}
        </>
      )
    }

    return (
      <div className="flux-schema-tree flux-tree-node">
        <div className="flux-schema-item no-hover" onClick={this.handleClick}>
          <div className="no-results">No more tag keys.</div>
        </div>
      </div>
    )
  }

  private handleClick(e: MouseEvent<HTMLDivElement>) {
    e.stopPropagation()
  }
}
