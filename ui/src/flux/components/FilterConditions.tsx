import React, {PureComponent} from 'react'
import {BinaryExpressionNode, MemberExpressionNode} from 'src/types/flux'

type FilterNode = BinaryExpressionNode | MemberExpressionNode

interface Props {
  nodes: FilterNode[]
}

class FilterConditions extends PureComponent<Props> {
  public render() {
    return (
      <>
        {this.props.nodes.map((n, i) => (
          <FilterConditionNode node={n} key={i} />
        ))}
      </>
    )
  }
}

interface FilterConditionNodeProps {
  node: FilterNode
}

/* tslint:disable */
class FilterConditionNode extends PureComponent<FilterConditionNodeProps> {
  public render() {
    return this.className
  }

  private get className(): JSX.Element {
    const {node} = this.props

    switch (node.type) {
      case 'ObjectExpression': {
        return <div className="flux-filter--key">{node.source}</div>
      }
      case 'MemberExpression': {
        const memberNode = node as MemberExpressionNode
        return (
          <div className="flux-filter--key">{memberNode.property.name}</div>
        )
      }
      case 'OpenParen': {
        return <div className="flux-filter--paren-open" />
      }
      case 'CloseParen': {
        return <div className="flux-filter--paren-close" />
      }
      case 'NumberLiteral':
      case 'IntegerLiteral': {
        return <div className="flux-filter--value number">{node.source}</div>
      }
      case 'BooleanLiteral': {
        return <div className="flux-filter--value boolean">{node.source}</div>
      }
      case 'StringLiteral': {
        return <div className="flux-filter--value string">{node.source}</div>
      }
      case 'Operator': {
        return <div className="flux-filter--operator">{node.source}</div>
      }
      default: {
        return <div />
      }
    }
  }
}

export default FilterConditions
