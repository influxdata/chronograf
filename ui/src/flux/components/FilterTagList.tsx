import React, {PureComponent, MouseEvent} from 'react'
import _ from 'lodash'

import {SchemaFilter, Service} from 'src/types'
import {
  OnChangeArg,
  Func,
  FilterClause,
  FilterTagCondition,
  FilterNode,
} from 'src/types/flux'
import FilterTagListItem from 'src/flux/components/FilterTagListItem'
import FancyScrollbar from '../../shared/components/FancyScrollbar'
import {getDeep} from 'src/utils/wrappers'

interface Props {
  db: string
  service: Service
  tags: string[]
  filter: SchemaFilter[]
  onChangeArg: OnChangeArg
  func: Func
  nodes: FilterNode[]
  bodyID: string
  declarationID: string
}

export default class FilterTagList extends PureComponent<Props> {
  public get clause(): FilterClause {
    return this.reduceNodesToClause(this.props.nodes, [])
  }

  public conditions(key: string, clause?): FilterTagCondition[] {
    clause = clause || this.clause
    return clause[key] || []
  }

  public operator(key: string, clause?): string {
    const conditions = this.conditions(key, clause)
    return getDeep<string>(conditions, '0.operator', '==')
  }

  public addCondition(condition: FilterTagCondition): FilterClause {
    const conditions = this.conditions(condition.key)
    return {
      ...this.clause,
      [condition.key]: [...conditions, condition],
    }
  }

  public removeCondition(condition: FilterTagCondition): FilterClause {
    const conditions = this.conditions(condition.key)
    const newConditions = _.reject(conditions, c => _.isEqual(c, condition))
    return {
      ...this.clause,
      [condition.key]: newConditions,
    }
  }

  public buildFilterString(clause: FilterClause): string {
    const funcBody = Object.entries(clause)
      .filter(([__, conditions]) => conditions.length)
      .map(([key, conditions]) => {
        const joiner = this.operator(key, clause) === '==' ? ' OR ' : ' AND '
        const subClause = conditions
          .map(c => `r.${key} ${c.operator} "${c.value}"`)
          .join(joiner)
        return '(' + subClause + ')'
      })
      .join(' AND ')
    return funcBody && `(r) => ${funcBody}`
  }

  public handleChangeValue = (
    key: string,
    value: string,
    selected: boolean
  ): void => {
    const condition: FilterTagCondition = {
      key,
      operator: this.operator(key),
      value,
    }
    const clause: FilterClause = selected
      ? this.addCondition(condition)
      : this.removeCondition(condition)
    const filterString: string = this.buildFilterString(clause)
    this.updateFilterString(filterString)
  }

  public handleSetEquality = (key: string, equal: boolean): void => {
    const operator = equal ? '==' : '!='
    const clause: FilterClause = {
      ...this.clause,
      [key]: this.conditions(key).map(c => ({...c, operator})),
    }
    const filterString: string = this.buildFilterString(clause)
    this.updateFilterString(filterString)
  }

  public updateFilterString = (newFilterString: string): void => {
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
              conditions={this.conditions(t)}
              operator={this.operator(t)}
              onChangeValue={this.handleChangeValue}
              onSetEquality={this.handleSetEquality}
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

  private reduceNodesToClause(
    nodes,
    conditions: FilterTagCondition[]
  ): FilterClause {
    if (!nodes.length) {
      return _.groupBy(conditions, condition => condition.key)
    } else if (
      ['OpenParen', 'CloseParen', 'Operator'].includes(nodes[0].type)
    ) {
      return this.reduceNodesToClause(nodes.slice(1), conditions)
    } else if (
      nodes.length >= 3 &&
      nodes[0].type === 'MemberExpression' &&
      nodes[1].type === 'Operator' &&
      nodes[2].type === 'StringLiteral'
    ) {
      const condition: FilterTagCondition = {
        key: nodes[0].property.name,
        operator: nodes[1].source,
        value: nodes[2].source.replace(/"/g, ''),
      }
      return this.reduceNodesToClause(nodes.slice(3), [
        ...conditions,
        condition,
      ])
    } else {
      console.log(nodes[0])
      return this.reduceNodesToClause(nodes.slice(1), conditions)
    }
  }

  private handleClick(e: MouseEvent<HTMLDivElement>) {
    e.stopPropagation()
  }
}
