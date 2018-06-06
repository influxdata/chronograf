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

export default class FilterTagList extends PureComponent<Props> {
  public get conditions(): TagCondition[] {
    const filterFunc: string = this.props.func.args.find(
      arg => arg.key === 'fn'
    ).value

    const conditionMatcher = /(r\.[\w\d-]* == "[\w\d-]+")/g
    const conditionStrings: string[] = filterFunc.match(conditionMatcher) || []

    const tagMatcher = /r\.([\w\d-]*) == "([\w\d-]+)"/
    const conditions: TagCondition[] = conditionStrings.map(str => {
      const [, tagKey, tagValue] = tagMatcher.exec(str)
      return {tagKey, tagValue}
    })

    return conditions
  }

  public addCondition(condition: TagCondition): TagCondition[] {
    return [...this.conditions, condition]
  }

  public removeCondition(condition: TagCondition): TagCondition[] {
    return _.reject(this.conditions, c => _.isEqual(c, condition))
  }

  public buildFilterString(conditions: TagCondition[]): string {
    const conditionString = conditions
      .map(c => `r.${c.tagKey} == "${c.tagValue}"`)
      .join(' AND ')
    return `(r) => ${conditionString}`
  }

  public selectedValues(key: string): string[] {
    return this.conditions.filter(c => c.tagKey === key).map(c => c.tagValue)
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
              selectedValues={this.selectedValues(t)}
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
