import React, {PureComponent, MouseEvent} from 'react'
import _ from 'lodash'

import {SchemaFilter, Service} from 'src/types'
import {
  OnChangeArg,
  Func,
  FilterTagKeyConditions,
  FilterTagKeyCondition,
} from 'src/types/flux'
import FilterTagListItem from 'src/flux/components/FilterTagListItem'
import FancyScrollbar from '../../shared/components/FancyScrollbar'

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
  public newKeyCondition(): FilterTagKeyCondition {
    return {operator: '==', tagValues: []}
  }
  public get conditions(): FilterTagKeyConditions {
    const filterFunc: string = this.props.func.args.find(
      arg => arg.key === 'fn'
    ).value

    const conditionMatcher = /(r\.[\w\d-]* (==|!=) "[\w\d-]+")/g
    const conditionStrings: string[] = filterFunc.match(conditionMatcher) || []

    const tagMatcher = /r\.([\w\d-]*) (==|!=) "([\w\d-]+)"/
    const conditions: FilterTagKeyConditions = conditionStrings.reduce(
      (acc, str) => {
        const [, tagKey, operator, tagValue] = tagMatcher.exec(str)
        const currentCondition: FilterTagKeyCondition =
          acc[tagKey] || this.newKeyCondition()
        const nextCondition: FilterTagKeyCondition = {
          operator,
          tagValues: [...currentCondition.tagValues, tagValue],
        }
        acc[tagKey] = nextCondition
        return acc
      },
      {}
    )

    return conditions
  }

  public addCondition({tagKey, tagValue}): FilterTagKeyConditions {
    const condition: FilterTagKeyCondition =
      this.conditions[tagKey] || this.newKeyCondition()
    const updatedCondition: FilterTagKeyCondition = {
      ...condition,
      tagValues: [...condition.tagValues, tagValue],
    }
    return {
      ...this.conditions,
      [tagKey]: updatedCondition,
    }
  }

  public removeCondition({tagKey, tagValue}): FilterTagKeyConditions {
    const condition: FilterTagKeyCondition =
      this.conditions[tagKey] || this.newKeyCondition()
    const updatedCondition: FilterTagKeyCondition = {
      ...condition,
      tagValues: _.reject(condition.tagValues, v => v === tagValue),
    }
    return {
      ...this.conditions,
      [tagKey]: updatedCondition,
    }
  }

  public buildFilterString(conditions: FilterTagKeyConditions): string {
    const conditionsPerKey = _.toPairs(conditions)
    const conditionString = conditionsPerKey
      .map(([key, {operator, tagValues}]) => {
        const joiner = operator === '==' ? ' OR ' : ' AND '
        return (
          '(' +
          tagValues.map(v => `r.${key} ${operator} "${v}"`).join(joiner) +
          ')'
        )
      })
      .join(' AND ')
    return `(r) => ${conditionString}`
  }

  public keyCondition(key: string): FilterTagKeyCondition {
    return this.conditions[key] || this.newKeyCondition()
  }

  public onChangeValue = (
    tagKey: string,
    tagValue: string,
    selected: boolean
  ): void => {
    const condition = {tagKey, tagValue}
    const conditions: FilterTagKeyConditions = selected
      ? this.addCondition(condition)
      : this.removeCondition(condition)
    const filterString: string = this.buildFilterString(conditions)
    this.propagateChange(filterString)
  }

  public setEquality = (tagKey: string, equal: boolean): void => {
    const keyCondition = this.conditions[tagKey] || this.newKeyCondition()
    const operator = equal ? '==' : '!='
    const newCondition: FilterTagKeyCondition = {
      ...keyCondition,
      operator,
    }
    const conditions: FilterTagKeyConditions = {
      ...this.conditions,
      [tagKey]: newCondition,
    }
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
        <FancyScrollbar className="flux-filter--fancyscroll" maxHeight={600}>
          {tags.map(t => (
            <FilterTagListItem
              key={t}
              db={db}
              tagKey={t}
              keyCondition={this.keyCondition(t)}
              onChangeValue={this.onChangeValue}
              onSetEquality={this.setEquality}
              service={service}
              filter={filter}
            />
          ))}
        </FancyScrollbar>
      )
    }

    return (
      <div className="flux-schema-tree">
        <div className="flux-schema--item no-hover" onClick={this.handleClick}>
          <div className="no-results">No more tag keys.</div>
        </div>
      </div>
    )
  }

  private handleClick(e: MouseEvent<HTMLDivElement>) {
    e.stopPropagation()
  }
}
